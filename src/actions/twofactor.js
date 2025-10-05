const { saveTwoFactorRecord, findTwoFactorRecord, findLatestTwoFactorRecord, markTwoFactorUsed, invalidateOlderTokens } = require('./../components/2facDB');

// Configuração mínima: validade padrão do token (em ms)
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutos

function generateSixDigitToken() {
	// Gera número entre 000000 e 999999 sempre com 6 dígitos
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Cria um token 2FA e persiste no banco.
 * subject: string que identifica quem está autenticando (ex.: userId, username, e-mail)
 * ttlMs: tempo de expiração em milissegundos (default: 1h)
 */
async function createTwoFactorToken(subject, ttlMs = DEFAULT_TTL_MS) {
	const token = generateSixDigitToken();
	const createdAt = new Date();
	const expiresAt = new Date(createdAt.getTime() + ttlMs);

	await saveTwoFactorRecord({ subject, token, createdAt, expiresAt, used: false });
	// Invalida tokens anteriores não usados, mantendo apenas o atual
	try { await invalidateOlderTokens(subject, token); } catch (_e) {}
	return { token, createdAt, expiresAt };
}

/**
 * Valida um token 2FA existente.
 * Retorna { valid: boolean, reason?: string }
 */
async function validateTwoFactorToken(subject, token) {
	// Aceita somente o último token
	const latest = await findLatestTwoFactorRecord(subject);
	if (!latest) return { valid: false, reason: 'not_found' };
	if (latest.used) return { valid: false, reason: 'used' };
	if (String(latest.token) !== String(token)) return { valid: false, reason: 'not_latest' };
	if (new Date() > new Date(latest.expiresAt)) return { valid: false, reason: 'expired' };

	// Consome o token após validação
	await markTwoFactorUsed(subject, token);
	return { valid: true };
}

module.exports = {
	createTwoFactorToken,
	validateTwoFactorToken
};


