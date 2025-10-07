const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { Verific, AddUser, Validation, EditUser, VerifyExist } = require("./../components/users");
const {sendDirectMessage} = require("./../actions/sendDM");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inscricao-parte-1")
        .setDescription("Iniciar Inscrição - Primeiro passo"),
    async execute(interaction,client,ex) {
        
        if ( ex === 1) {
            // console.log('aooopppp')
            // interaction.reply()
            // console.log("ssssssssssssss")
            await interaction.deferReply({ ephemeral: true });
            await sendDirectMessage(client,interaction.user.username,`**✅ Você já foi cadastrado com sucesso.** \n_Para mudar consulte um administrador._`);
            await interaction.deleteReply();
            return 0;
        } else {
            console.log("dsasd")
            const [modal, keys] = await createPopupOne(interaction); //criando o popup modal com discord.js
            //mostrando na tela
            await interaction.showModal(modal);
            //esperando a interação do usuario para prosseguir
            const filter = (interaction) => interaction.customId === keys.user;
            interaction.awaitModalSubmit({ filter, time: 30_000 }).then((modalInteraction) => {
                const cpf = modalInteraction.fields.getTextInputValue(keys.input.cpf)
                const cpfLimpo = cpf.replace(/[^\d]/g, "");
                const phone = modalInteraction.fields.getTextInputValue(keys.input.phone)
                const phoneLimpo = phone.replace(/[^\d]/g, "");
                AddUser(
                    {
                        name: modalInteraction.fields.getTextInputValue(keys.input.name),
                        cpf: cpfLimpo,
                        phone: phoneLimpo,
                        pixkey: modalInteraction.fields.getTextInputValue(keys.input.pixkey),
                        userID: interaction.user.id,
                        social_networks: "",
                        dc_username: interaction.user.username
                    },

                ).then(r => {
                    if ((r.status != "") && (r.status != null) && (r.status != undefined)) {
                        if ((r.message != "") && (r.message != null) && (r.message != undefined)) {
                            console.log(r.message)
                            // modalInteraction.reply();
                            sendDirectMessage(client,interaction.user.username,r.message);
                            modalInteraction.deferUpdate(); 
                        }
                    }
                })

                //abrir outra modal aqui e repetir o processo.
            }).catch((err) => {
                console.log(err);
            })
        }

    }
}

// EditUser(
//     {dc_username:interaction.user.username},
//     {
//         name: modalInteraction.fields.getTextInputValue(keys.input.name),
//         cpf: modalInteraction.fields.getTextInputValue(keys.input.cpf),
//         phone: modalInteraction.fields.getTextInputValue(keys.input.phone),
//         pixkey: modalInteraction.fields.getTextInputValue(keys.input.pixkey),
//     }
// );

async function createPopupOne(interaction) {
    const keys = {
        user: `myModal-${interaction.user.id}`,
        input: {
            name: "nameInput",
            cpf: "cpfInput",
            phone: "phoneInput",
            pixkey: "pixkeyInput",
        }
    }


    const modal = new ModalBuilder()
        .setCustomId(keys.user)
        .setTitle('Cadastre Seus Dados');

    const nameInput = new TextInputBuilder()
        .setCustomId(keys.input.name)
        .setLabel("Nome:")
        .setStyle(TextInputStyle.Short);

    const cpfInput = new TextInputBuilder()
        .setCustomId(keys.input.cpf)
        .setLabel("CPF:")
        .setStyle(TextInputStyle.Short);

    const phoneInput = new TextInputBuilder()
        .setCustomId(keys.input.phone)
        .setLabel("Telefone:")
        .setStyle(TextInputStyle.Short);

    const pixkeyInput = new TextInputBuilder()
        .setCustomId(keys.input.pixkey)
        .setLabel("Chave Pix:")
        .setStyle(TextInputStyle.Short);


    modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(cpfInput),
        new ActionRowBuilder().addComponents(phoneInput),
        new ActionRowBuilder().addComponents(pixkeyInput),
    );

    return [modal, keys];
}


// const hobbiesInput = new TextInputBuilder()
//     .setCustomId('hobbiesInput')
//     .setLabel("What's some of your favorite hobbies?")
//     // Paragraph means multiple lines of text.
//     .setStyle(TextInputStyle.Paragraph);