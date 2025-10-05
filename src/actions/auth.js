const { createTwoFactorToken, validateTwoFactorToken } = require('./twofactor');
const { sendDirectMessage } = require('./sendDM');

/**
 * Solicita 2FA: cria token de 6 dígitos e envia por DM.
 * - Espera um `client` do discord.js já logado
 * - `subject` identifica quem está autenticando (ex.: userId/username do Discord)
 * - Retorna { ok: boolean, token?, createdAt?, expiresAt?, error? }
 */
async function requestTwoFactor(client, subject) {
	try {
		const { token, createdAt, expiresAt } = await createTwoFactorToken(subject);
		const sent = await sendDirectMessage(client, subject, `Seu código de verificação é: ${token}`);
		if (!sent) {
			return { ok: false, error: 'dm_failed' };
		}
		return { ok: true, token, createdAt, expiresAt };
	} catch (err) {
		return { ok: false, error: String(err) };
	}
}

/**
 * Valida um token 2FA para o `subject` informado.
 * - Retorna { ok: boolean, reason?: 'not_found'|'expired' }
 */
async function verifyTwoFactor(subject, token) {
	const result = await validateTwoFactorToken(subject, token);
	return { ok: result.valid, reason: result.reason };
}

module.exports = {
	requestTwoFactor,
	verifyTwoFactor
};


