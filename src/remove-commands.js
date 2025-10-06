const { Client} = require('discord.js');    
const dotenv = require('dotenv');
dotenv.config();
const {TOKEN, CLIENT_ID, GUILD_ID} = process.env;

const client = new Client({ intents: [] });

client.on('ready', async () => {
    console.log(`Bot logado como ${client.user.tag}!`);

    // --- COLOQUE O CÓDIGO AQUI ---
    const guildId = GUILD_ID; 
    try {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            await guild.commands.set([]); 
            console.log(`Comandos da Guilda ID ${guildId} foram excluídos.`);
        }
    } catch (error) {
        console.error('Erro ao excluir comandos:', error);
    }
    // ----------------------------
});

client.login(TOKEN);