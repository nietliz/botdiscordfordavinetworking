// Carrega variáveis de ambiente
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { ObjectId } = require('mongodb');
const { connectDB } = require('./connectiondb');
const { client } = require('./index');
const { requestTwoFactor, verifyTwoFactor } = require('./actions/auth');
const { verifyFrontendAccess } = require('./actions/verifyaccess');
const { searchUsers } = require('./components/searchusers');

// Rate limiting simples para pesquisa
const searchRateLimit = new Map();
const SEARCH_RATE_LIMIT = {
    maxRequests: 10, // máximo 10 pesquisas
    windowMs: 60000, // por minuto
    blockDurationMs: 300000 // bloqueia por 5 minutos se exceder
};

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Parsers
app.use(express.urlencoded({ extended: false }));

// Middleware de verificação de acesso (protege contra Postman, curl, etc.)
app.use(verifyFrontendAccess);

// Sessão (mínimo viável)
app.use(session({
	secret: 'SUA_CHAVE_SECRETA', // Use uma string forte aqui
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false } // Use 'true' em HTTPS/Produção
}));

// Lista de usuários permitidos (USER{N}_USER, USER{N}_PASSWORD, USER{N}_DCNICK)
const ALLOWED_USERS = [1,2,3].map(n => ({
    username: process.env[`USER${n}_USER`] || '',
    password: process.env[`USER${n}_PASSWORD`] || '',
    dcnick: process.env[`USER${n}_DCNICK`] || ''
})).filter(u => u.username && u.password && u.dcnick);
// Removido 2FA via Discord

function ensureAuthenticated(req, res, next) {
	if (req.session.isAuthenticated) {
		return next();
	}
	res.redirect('/login');
}

// Rotas públicas
app.get('/login', (req, res) => {
	const error = req.query.error || '';
	res.render('login', { error });
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body || {};
	const match = ALLOWED_USERS.find(u => u.username === username && u.password === password);
	if (match) {
		req.session.isAuthenticated = true;
		req.session.twofactorVerified = false;
		req.session.twofactorSubject = match.dcnick; // 2FA só para o DC nick permitido
		return res.redirect('/auth');
	}
	return res.status(401).render('login', { error: 'Credenciais inválidas.' });
});

app.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/login');
	});
});

// Rotas protegidas
app.get('/auth', ensureAuthenticated, (req, res) => {
	const error = req.query.error || '';
	const message = req.query.message || '';
	const subject = req.session.twofactorSubject || process.env.TWOFA_SUBJECT || 'nietliz';
	return res.render('auth', { error, message, subject });
});

app.post('/auth/send', ensureAuthenticated, async (req, res) => {
	const subject = (req.body && req.body.subject) || req.session.twofactorSubject || 'nietliz';
	const result = await requestTwoFactor(client, subject);
	if (!result.ok) {
		return res.status(500).render('auth', { error: 'Falha ao enviar o código por DM.', message: '', subject });
	}
	return res.render('auth', { error: '', message: 'Código enviado por DM.', subject });
});

app.post('/auth/verify', ensureAuthenticated, async (req, res) => {
	const subject = (req.body && req.body.subject) || req.session.twofactorSubject || 'nietliz';
	const token = (req.body && req.body.token) || '';
	const result = await verifyTwoFactor(subject, token);
	if (!result.ok) {
		const reason = result.reason === 'expired' ? 'Código expirado.' : 'Código inválido.';
		return res.status(401).render('auth', { error: reason, message: '', subject });
	}
	req.session.twofactorVerified = true;
	return res.redirect('/users');
});

function ensureTwoFactorVerified(req, res, next) {
	if (req.session && req.session.twofactorVerified) return next();
	return res.redirect('/auth');
}

// Middleware de rate limiting para pesquisa
function searchRateLimitMiddleware(req, res, next) {
	const clientIP = req.ip || req.connection.remoteAddress;
	const now = Date.now();
	
	// Limpa entradas antigas
	for (const [ip, data] of searchRateLimit.entries()) {
		if (now - data.lastRequest > SEARCH_RATE_LIMIT.windowMs) {
			searchRateLimit.delete(ip);
		}
	}
	
	const clientData = searchRateLimit.get(clientIP);
	
	if (!clientData) {
		// Primeira requisição
		searchRateLimit.set(clientIP, {
			requestCount: 1,
			lastRequest: now,
			blockedUntil: 0
		});
		return next();
	}
	
	// Verifica se está bloqueado
	if (clientData.blockedUntil > now) {
		console.warn(`🚨 Rate limit excedido para IP: ${clientIP}`);
		return res.status(429).render('users', { 
			users: [], 
			searchResults: [], 
			searchQuery: req.query.q || '', 
			isSearch: true, 
			message: 'Muitas pesquisas. Aguarde alguns minutos antes de tentar novamente.' 
		});
	}
	
	// Verifica se excedeu o limite
	if (clientData.requestCount >= SEARCH_RATE_LIMIT.maxRequests) {
		clientData.blockedUntil = now + SEARCH_RATE_LIMIT.blockDurationMs;
		console.warn(`🚨 Rate limit excedido para IP: ${clientIP} - Bloqueado por ${SEARCH_RATE_LIMIT.blockDurationMs/1000}s`);
		return res.status(429).render('users', { 
			users: [], 
			searchResults: [], 
			searchQuery: req.query.q || '', 
			isSearch: true, 
			message: 'Muitas pesquisas. Aguarde alguns minutos antes de tentar novamente.' 
		});
	}
	
	// Incrementa contador
	clientData.requestCount++;
	clientData.lastRequest = now;
	
	next();
}

app.get('/users', ensureAuthenticated, ensureTwoFactorVerified, async (req, res) => {
	try {
		const db = await connectDB();
		// Buscar lista simples (id e dc_username)
		const docs = await db
			.collection('teste2')
			.find({}, { projection: { dc_username: 1 } })
			.toArray();

		const users = docs.map(d => ({ id: d._id.toString(), dc_username: d.dc_username || '(sem nome)' }));
		const message = req.query.message || '';
		return res.render('users', { users, message });
	} catch (err) {
		return res.status(500).send('Erro ao carregar usuários.');
	}
});

app.get('/users/search', ensureAuthenticated, ensureTwoFactorVerified, searchRateLimitMiddleware, async (req, res) => {
	try {
		const searchQuery = req.query.q || '';
		
		if (!searchQuery.trim()) {
			return res.redirect('/users');
		}

		const searchResults = await searchUsers(searchQuery);
		const message = req.query.message || '';
		
		return res.render('users', { 
			users: [], 
			searchResults, 
			searchQuery, 
			isSearch: true, 
			message 
		});
	} catch (err) {
		console.error('Erro na pesquisa:', err);
		return res.status(500).render('users', { 
			users: [], 
			searchResults: [], 
			searchQuery: req.query.q || '', 
			isSearch: true, 
			message: 'Erro ao realizar pesquisa.' 
		});
	}
});

app.get('/users/:id', ensureAuthenticated, ensureTwoFactorVerified, async (req, res) => {
	try {
		const { id } = req.params;
		const db = await connectDB();
		const user = await db.collection('teste2').findOne({ _id: new ObjectId(id) });
		if (!user) {
			return res.status(404).send('Usuário não encontrado');
		}
		const userJson = JSON.stringify(user, null, 2);
		return res.render('user_details', { user, userJson, id });
	} catch (err) {
		return res.status(400).send('ID inválido ou erro ao buscar usuário.');
	}
});

app.post('/users/:id/delete', ensureAuthenticated, ensureTwoFactorVerified, async (req, res) => {
	try {
		const { id } = req.params;
		const db = await connectDB();
		
		// Verifica se o usuário existe
		const user = await db.collection('teste2').findOne({ _id: new ObjectId(id) });
		if (!user) {
			return res.status(404).send('Usuário não encontrado');
		}
		
		// Exclui o usuário do banco
		const result = await db.collection('teste2').deleteOne({ _id: new ObjectId(id) });
		
		if (result.deletedCount === 1) {
			console.log(`✅ Usuário ${id} excluído com sucesso`);
			return res.redirect('/users?message=Usuário excluído com sucesso');
		} else {
			return res.status(500).send('Erro ao excluir usuário');
		}
	} catch (err) {
		console.error('Erro ao excluir usuário:', err);
		return res.status(400).send('ID inválido ou erro ao excluir usuário.');
	}
});

// Raiz -> redireciona conforme login
app.get('/', (req, res) => {
	if (req.session.isAuthenticated) return res.redirect('/users');
	return res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Servidor web iniciado em http://localhost:${PORT}`);
});