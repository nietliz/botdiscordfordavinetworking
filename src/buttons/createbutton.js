const { SlashCommandBuilder,ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const userExample = {
	id: 0,
	name: "Seloko Zezim ze",
	cpf: 23124234583923,
	phone: 16992888
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("criar-botao-cadastro")
		.setDescription("Cria os 2 botãos de cadastro."),
	async execute(interaction) {

        const button = new ButtonBuilder()
            .setLabel('discord.js docs')
            .setURL('https://discord.js.org') 
            .setStyle(ButtonStyle.Link); 

        const button2 = new ButtonBuilder()
            .setLabel('discord.js docs')
            .setURL('https://discord.js.org') 
            .setStyle(ButtonStyle.Link); 

		await interaction.reply({
			content: `Are you sure you want to ban ${target} for reason: ${reason}?`,
			components: [row],
		});
	}
}



//vou registrar um usiario aqui.
