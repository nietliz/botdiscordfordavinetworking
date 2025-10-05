const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { Verific, AddUser, EditUser, Validation, VerifyExist } = require("./../components/users");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-networks")
        .setDescription("Abri formulario de inscrição"),
    async execute(interaction) {
        // if(VerifyExist(interaction.user.username)){
        //     await interaction.reply(`**✅ Suas redes já estão cadastradas com sucesso.** \n_para mudar consulte um administrador._`)
        //     return;
        // }

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
                    facebook: modalInteraction.fields.getTextInputValue(keys.input.facebook),
                    instagram: modalInteraction.fields.getTextInputValue(keys.input.instagram),
                    youtube: modalInteraction.fields.getTextInputValue(keys.input.youtube),
                    tiktok: modalInteraction.fields.getTextInputValue(keys.input.tiktok),
                    kawai: modalInteraction.fields.getTextInputValue(keys.input.kawai)
                }
            ).then(r => {
                if((r.status != "") && (r.status != null) && (r.status != undefined)){
                    if((r.message != "") && (r.message != null) && (r.message != undefined)){
                        console.log(r.message)
                        modalInteraction.reply(r.message);
                    }
                }
            })

        })

    }
}

async function createPopupOne(interaction) {
    const keys = {
        user: `ns-${interaction.user.id}`,
        input: {
            facebook: "facebookInput",
            instagram: "instagramInput",
            youtube: "youtubeInput",
            tiktok: "tiktokInput",
            kawai: "kawaiInput",
        }
    }


    const modal = new ModalBuilder()
        .setCustomId(keys.user)
        .setTitle('Redes Sociais');

    const facebook = new TextInputBuilder()
        .setCustomId(keys.input.facebook)
        .setLabel("Facebook:")
        .setStyle(TextInputStyle.Short);

    const instagram = new TextInputBuilder()
        .setCustomId(keys.input.instagram)
        .setLabel("Instagram:")
        .setStyle(TextInputStyle.Short);

    const youtube = new TextInputBuilder()
        .setCustomId(keys.input.youtube)
        .setLabel("Youtube:")
        .setStyle(TextInputStyle.Short);

    const tiktok = new TextInputBuilder()
        .setCustomId(keys.input.tiktok)
        .setLabel("Tiktok:")
        .setStyle(TextInputStyle.Short);

    const kawai = new TextInputBuilder()
        .setCustomId(keys.input.kawai)
        .setLabel("Kawai:")
        .setStyle(TextInputStyle.Short);


    modal.addComponents(
        new ActionRowBuilder().addComponents(facebook),
        new ActionRowBuilder().addComponents(instagram),
        new ActionRowBuilder().addComponents(youtube),
        new ActionRowBuilder().addComponents(tiktok),
        new ActionRowBuilder().addComponents(kawai)
    );

    return [modal, keys];
}


// const hobbiesInput = new TextInputBuilder()
//     .setCustomId('hobbiesInput')
//     .setLabel("What's some of your favorite hobbies?")
//     // Paragraph means multiple lines of text.
//     .setStyle(TextInputStyle.Paragraph);