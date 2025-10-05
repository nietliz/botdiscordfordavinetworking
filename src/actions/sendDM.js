// Serviço mínimo para enviar DM no Discord usando um client já existente
// Uso básico:
// const { sendDirectMessage } = require('./actions/sendDM');
// await sendDirectMessage(client, 'nietliz', 'Olá!');

/**
 * Envia uma DM para um usuário no Discord.
 * - Não cria nem faz login de client; espera um `client` já logado.
 * - Aceita ID do usuário ou um nome (será feita uma busca simples pelos servidores do bot).
 * - Mantém implementação mínima e resiliente.
 * @param {import('discord.js').Client} client - Client já logado do discord.js
 * @param {string} target - ID do usuário (preferencial) ou nome (ex.: 'nietliz')
 * @param {string} message - Mensagem a ser enviada
 * @returns {Promise<boolean>} true se enviado com sucesso; false caso contrário
 */
async function sendDirectMessage(client, target = 'nietliz', message = 'Seu código ou mensagem aqui.') {
	if (!client || typeof client.users?.fetch !== 'function') {
		return false;
	}

	// 1) Tenta como ID diretamente (melhor caminho)
	if (/^\d{15,25}$/.test(target)) {
		try {
			const user = await client.users.fetch(target);
			await user.send(message);
			return true;
		} catch (_err) {
			// fallback abaixo
		}
	}

	// 2) Fallback simples por nome: tenta primeiro no cache de usuários conhecidos
	let foundUser = null;
	try {
		// Procura no cache básico
		foundUser = client.users.cache.find(u => normalize(u.username) === normalize(target));
		if (foundUser) {
			await foundUser.send(message);
			return true;
		}
	} catch (_err) { /* continua */ }

	// 3) Fallback por servidores: faz uma busca superficial por membros (requer GuildMembers intent habilitada no client do chamador)
	try {
		for (const [, guild] of client.guilds.cache) {
			if (typeof guild.members?.search === 'function') {
				const res = await guild.members.search({ query: target, limit: 1 });
				const member = res?.first?.();
				if (member?.user) {
					await member.user.send(message);
					return true;
				}
			}
		}
	} catch (_err) { /* ignora e falha silenciosamente */ }

	return false;
}

function normalize(str) {
	return String(str || '').trim().toLowerCase();
}

module.exports = { sendDirectMessage };


