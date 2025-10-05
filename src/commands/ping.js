const { SlashCommandBuilder } = require("discord.js")

const userExample = {
	id: 0,
	name: "Seloko Zezim ze",
	cpf: 23124234583923,
	phone: 16992888
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Responde com 'Pong!'"),
	async execute(interaction) {
		await interaction.reply("Pong! hahahha")
		
	}
}



//vou registrar um usiario aqui.