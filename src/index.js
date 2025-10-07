const { Client, Events, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, Component, ComponentType, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;
const { sendDirectMessage } = require('./actions/sendDM.js');
const { VerifyExist, VerifyExistTwo } = require("./components/users");
const { AddMsg, VerifyMsg } = require("./components/messageSaverDb");


const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();



const fs = require('node:fs');
const path = require('node:path');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
	// client.commands.set(command.data.name, command);
	// console.log(command)
}
// console.log(client.commands);


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	VerifyMsg().then(x => {
		console.log("olha SOI ISSSO!", x)

		if (x === 1) return;

		const canal = client.channels.cache.get("1424835857868914688");
		if (!canal) {
			console.log(canal)
			console.error(`Erro: Canal com ID 1424835857868914688 não encontrado.`);
			return;
		}

		canal.send(`## BEM-VINDOS À COMPETIÇÃO! \n A jornada de **Marketing Digital** 📈 e **Crescimento Financeiro** começa agora. \nPara garantir sua **participação oficial** no torneio de **Cortes** (Redes Sociais) ✂️, é obrigatório realizar o cadastro de inscrição aqui no servidor. \n\nPor favor, siga as instruções e preencha seus **dados** e **redes sociais**. Não perca o prazo! A hora de começar a faturar 💰 é esta. Boa sorte a todos!\n`)
			.then((message) => {
				console.log('Mensagem enviada com sucesso.')
				AddMsg({ id_msg: message.id, content: message.content });
			})
			.catch(error => console.error('Erro ao enviar mensagem:', error));

		const button = new ButtonBuilder()
			.setCustomId('openmodal_button_1')
			.setLabel('1° Cadastrar Dados')
			.setStyle(ButtonStyle.Success);

		const button2 = new ButtonBuilder()
			.setCustomId('openmodal_button_2')
			.setLabel('2° Cadastrar Redes')
			.setStyle(ButtonStyle.Success);

		const row_message = new ActionRowBuilder().addComponents(button, button2)
		// const row_message2 = new ActionRowBuilder().addComponents(button2)

		const response = canal.send({ components: [row_message] })
			.then((x) => {
				console.log("enviou")
			})
			.catch(error => console.error('Erro ao enviar mensagem:', error));


		console.log(response);

		// sendDirectMessage(client, "nietliz", "oiiii, vc ta baum?");
	});


});

client.login(TOKEN);

client.on(Events.InteractionCreate, async interaction => {
	let cm = "inscricao-parte-1"
	let ex = "";
	if (interaction.customId == "openmodal_button_1" || interaction.customId == "openmodal_button_2") {
		ex = await VerifyExist(interaction.user.username);
		if (interaction.customId == "openmodal_button_2") {
			cm = "inscricao-parte-2"
			ex = {
				two: await VerifyExistTwo(interaction.user.username),
				three: await VerifyExist(interaction.user.username)
			}
		}

		const command = client.commands.get(cm);
		command.execute(interaction, client, ex); //se for escalar, precisa mexer nisso. Ou colocar como parametro opcional em todos os comandos

	}

	if (!interaction.isChatInputCommand()) return;
	// console.log(interaction);
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

module.exports = { client };