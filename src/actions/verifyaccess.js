// Serviço simples para verificar se a requisição vem do seu frontend
// Bloqueia Postman, curl, cmd e outros serviços externos

const ALLOWED_ORIGINS = [
    'http://localhost:3000',           // desenvolvimento local
    'https://seudominio.com',          // seu domínio de produção
    'https://www.seudominio.com',      // www do seu domínio
    // Adicione outros domínios permitidos aqui
];

const API_KEY = process.env.FRONTEND_API_KEY;
const { decrypt } = require('./crypt');

/**
 * Middleware para verificar se a requisição vem do seu frontend
 * @param {Object} req - Request object do Express
 * @param {Object} res - Response object do Express
 * @param {Function} next - Next middleware function
 */
function verifyFrontendAccess(req, res, next) {
    const origin = req.get('Origin') || req.get('Referer');
    const encryptedApiKey = req.get('X-API-Key') || req.body?.apiKey;
    
    // Verifica se a origem está na lista permitida
    const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
        origin && origin.startsWith(allowed)
    );
    
    // Descriptografa e verifica se a API key está correta
    let hasValidApiKey = false;
    if (encryptedApiKey) {
        try {
            const decryptedApiKey = decrypt(encryptedApiKey);
            hasValidApiKey = decryptedApiKey === API_KEY;
        } catch (error) {
            console.log('Erro ao descriptografar API key:', error.message);
            hasValidApiKey = false;
        }
    }
    
    // Permite acesso se:
    // 1. A origem está na lista permitida OU
    // 2. Tem a API key correta (descriptografada) OU
    // 3. É uma requisição GET para páginas (não API)
    if (isAllowedOrigin || hasValidApiKey || (req.method === 'GET' && !req.path.startsWith('/api'))) {
        return next();
    }
    
    // Bloqueia acesso
    console.log(`Acesso bloqueado - Origin: ${origin}, IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Este serviço só pode ser acessado pelo frontend autorizado' 
    });
}

/**
 * Middleware mais restritivo - só permite seu domínio específico
 */
function strictFrontendAccess(req, res, next) {
    const origin = req.get('Origin') || req.get('Referer');
    
    if (!origin) {
        return res.status(403).json({ error: 'Origin header obrigatório' });
    }
    
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
        origin.startsWith(allowed)
    );
    
    if (!isAllowed) {
        console.log(`Acesso bloqueado (strict) - Origin: ${origin}, IP: ${req.ip}`);
        return res.status(403).json({ error: 'Domínio não autorizado' });
    }
    
    return next();
}

module.exports = {
    verifyFrontendAccess,
    strictFrontendAccess
};
