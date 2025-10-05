const express = require('express');
const path = require('path');
const session = require('express-session');
const { ObjectId } = require('mongodb');
const { connectDB } = require('./connectiondb');
const { client } = require('./index');
const { requestTwoFactor, verifyTwoFactor } = require('./actions/auth');
const { verifyFrontendAccess } = require('./actions/verifyaccess');
const { encrypt, decrypt } = require('./actions/crypt');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Disponibiliza funções para as views EJS
app.locals.encrypt = encrypt;

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
	const apiKey = process.env.FRONTEND_API_KEY || '';
	res.render('login', { error, apiKey });
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
	const apiKey = process.env.FRONTEND_API_KEY || '';
	return res.render('auth', { error, message, subject, apiKey });
});

app.post('/auth/send', ensureAuthenticated, async (req, res) => {
	const subject = (req.body && req.body.subject) || req.session.twofactorSubject || 'nietliz';
	const apiKey = process.env.FRONTEND_API_KEY || '';
	const result = await requestTwoFactor(client, subject);
	if (!result.ok) {
		return res.status(500).render('auth', { error: 'Falha ao enviar o código por DM.', message: '', subject, apiKey });
	}
	return res.render('auth', { error: '', message: 'Código enviado por DM.', subject, apiKey });
});

app.post('/auth/verify', ensureAuthenticated, async (req, res) => {
	const subject = (req.body && req.body.subject) || req.session.twofactorSubject || 'nietliz';
	const token = (req.body && req.body.token) || '';
	const apiKey = process.env.FRONTEND_API_KEY || '';
	const result = await verifyTwoFactor(subject, token);
	if (!result.ok) {
		const reason = result.reason === 'expired' ? 'Código expirado.' : 'Código inválido.';
		return res.status(401).render('auth', { error: reason, message: '', subject, apiKey });
	}
	req.session.twofactorVerified = true;
	return res.redirect('/users');
});

function ensureTwoFactorVerified(req, res, next) {
	if (req.session && req.session.twofactorVerified) return next();
	return res.redirect('/auth');
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
		return res.render('users', { users });
	} catch (err) {
		return res.status(500).send('Erro ao carregar usuários.');
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

// Raiz -> redireciona conforme login
app.get('/', (req, res) => {
	if (req.session.isAuthenticated) return res.redirect('/users');
	return res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Servidor web iniciado em http://localhost:${PORT}`);
});