const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { Verific, AddUser, EditUser, Validation, VerifyExist, VerifyExistTwo } = require("./../components/users");
const {sendDirectMessage} = require("./../actions/sendDM");

async function manageUserRole(interaction, roleName, message_pass,client) {
    const GUILD_ID = interaction.guildId;
    const USER_ID = interaction.user.id;

    if (!GUILD_ID) {
        console.error('Interação sem GUILD_ID. Não é possível gerenciar cargos.');
        return;
    }

    try {
        const guild = interaction.client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.error('Guilda não encontrada.');
            return;
        }

        // 1. Tentar Obter/Criar o Cargo
        let role = guild.roles.cache.find(r => r.name === roleName);

        if (!role) {
            console.log(`Cargo "${roleName}" não encontrado. Criando...`);
            role = await guild.roles.create({
                name: roleName,
                color: '#808080',
                permissions: [],
                reason: `Criação modular para validação de usuário: ${interaction.user.tag}`
            });
        }

        // 2. Obter o Membro
        const member = await guild.members.fetch(USER_ID);

        // 3. Verificação de Posse
        if (member.roles.cache.has(role.id)) {
            // await interaction.reply({ content: `✅ Você já possui o cargo **${roleName}**.`, ephemeral: true });
            // await interaction.reply({ content: message_pass, ephemeral: true });
            await sendDirectMessage(client,interaction.user.username,message_pass);

            return;
        }

        // 4. Adicionar o Cargo
        await member.roles.add(role);

        // 5. Resposta final
        await sendDirectMessage(client,interaction.user.username,message_pass);
        //  interaction.reply({ content: , ephemeral: true });

    } catch (error) {
        console.error('Erro modular de gerenciamento de cargo:', error);
        await interaction.reply({ content: '❌ Erro no servidor: Verifique as permissões do bot.', ephemeral: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inscricao-parte-2")
        .setDescription("Terminar Inscrição - Ultimo Passo"),
    async execute(interaction,client,ex) {
        const ex2 = ex.two
        const ex3 = ex.three
        
        if (ex2 === 1) {
            await interaction.deferReply({ ephemeral: true });
            manageUserRole(interaction, "clipador", `**✅ Suas redes já estão cadastradas com sucesso.** \n_para mudar consulte um administrador._`,client)
            await interaction.deleteReply();
            return 0;
        } else if (ex3 === 0) {
            // await interaction.reply();
            console.log("veio ate aqui")
            await interaction.deferReply({ ephemeral: true });
            await sendDirectMessage(client,interaction.user.username,`**❌ Você ainda não fez o passo 1. Por favor não pule etapas.**`);
            await interaction.deleteReply(); 
          
            
            return 0;
        } else {

            //OK: falta eu verificar se as redes ja foram cadastradas e bloquear elas tbm. Basicamente é só eu adicionar nas propriedades do social_networks, o .ok:false/true; e dai eu crio outra função exists pra esse caso
            //OK: dai seria necessario eu por um botão excluir na tabela de usuarios. Pra caso a pessoa tenha digitado errado. Dai mostrar assim. Agr, pra colocar no ar. só Deus. Hoje tem trampo.
            //ok: e tbm nn deixar a pessoa pular pra parte 2 antes de ter feito a 1.
            //ok: outro detalhe, ele só pode fazer essas preula em uma sala especifica; (usar o id sla)
            //ok: esqueci, ele tem que colocar um cargo em mim quando termina.
            //LOUVADO SEJA DEUS

            const [modal, keys] = await createPopupOne(interaction); //criando o popup modal com discord.js

            //mostrando na tela
            await interaction.showModal(modal);

            //esperando a interação do usuario para prosseguir
            const filter = (interaction) => interaction.customId === keys.user;
            interaction.awaitModalSubmit({ filter, time: 300_000 }).then((modalInteraction) => {
                //guardando os dados em variaveis
                EditUser(
                    { dc_username: interaction.user.username },
                    {
                        instagram: modalInteraction.fields.getTextInputValue(keys.input.instagram) || '',
                        youtube: modalInteraction.fields.getTextInputValue(keys.input.youtube) || '',
                        tiktok: modalInteraction.fields.getTextInputValue(keys.input.tiktok) || '',
                        ok: true,
                    }
                ).then(r => {
                    if ((r.status != "") && (r.status != null) && (r.status != undefined)) {
                        if ((r.message != "") && (r.message != null) && (r.message != undefined)) {
                            // console.log(r.message)
                            manageUserRole(modalInteraction, "clipador", r.message,client)
                            modalInteraction.deferUpdate();
                        }
                    }
                })

            })
        }
    }
}

async function createPopupOne(interaction) {
    const keys = {
        user: `ns-${interaction.user.id}`,
        input: {
            instagram: "instagramInput",
            youtube: "youtubeInput",
            tiktok: "tiktokInput",
        }
    }


    const modal = new ModalBuilder()
        .setCustomId(keys.user)
        .setTitle('Redes Sociais');

    const instagram = new TextInputBuilder()
        .setCustomId(keys.input.instagram)
        .setLabel("Instagram:")
        .setStyle(TextInputStyle.Short)
        .setValue('')
        .setRequired(false);

    const youtube = new TextInputBuilder()
        .setCustomId(keys.input.youtube)
        .setLabel("Youtube:")
        .setStyle(TextInputStyle.Short)
        .setValue('')
        .setRequired(false);

    const tiktok = new TextInputBuilder()
        .setCustomId(keys.input.tiktok)
        .setLabel("Tiktok:")
        .setStyle(TextInputStyle.Short)
        .setValue('')
        .setRequired(false);



    modal.addComponents(
        new ActionRowBuilder().addComponents(instagram),
        new ActionRowBuilder().addComponents(youtube),
        new ActionRowBuilder().addComponents(tiktok),
    );

    return [modal, keys];
}


// const hobbiesInput = new TextInputBuilder()
//     .setCustomId('hobbiesInput')
//     .setLabel("What's some of your favorite hobbies?")
//     // Paragraph means multiple lines of text.
//     .setStyle(TextInputStyle.Paragraph);