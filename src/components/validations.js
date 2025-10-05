function registerUserValidation(user) {
    const state = true;
    const status = "sucess";

    if (!user.name) {
        return [false, "Existem Campos Vazios"];
    }

    if (!user.cpf) {
        return [false, "Existem Campos Vazios"];
    }

    if (!user.phone) {
        return [false, "Existem Campos Vazios"];
    }

    console.log(user.name.split(""));

    //name
    if (user.name.split("").length < 3) {
        return [false, "Digite seu nome completo"];
    }

    //phone
    if (user.phone.split("").length < 8) {
        return [false, "Telefone deve ser maior que 8 Digitos"];
    }

    //cpf (pronto)
    if (!verify_cpf(user.cpf)) {
        return [false, "CPF Inválido"];
    }


    return [state, status];
}


function editUserValidation(changes) {

    for (const key in changes) {
        // console.log(key);
        const element = changes[key];
        const regex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!regex.test(element)) {
            
            return [false, "Por Favor corrija o campo " + key]

        }
    }

    return [true, "sucess"];
}





function verify_cpf(cpf) {
    var Soma = 0
    var Resto

    var strCPF = String(cpf).replace(/[^\d]/g, '')

    if (strCPF.length !== 11)
        return false

    if ([
        '00000000000',
        '11111111111',
        '22222222222',
        '33333333333',
        '44444444444',
        '55555555555',
        '66666666666',
        '77777777777',
        '88888888888',
        '99999999999',
    ].indexOf(strCPF) !== -1)
        return false

    for (i = 1; i <= 9; i++)
        Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);

    Resto = (Soma * 10) % 11

    if ((Resto == 10) || (Resto == 11))
        Resto = 0

    if (Resto != parseInt(strCPF.substring(9, 10)))
        return false

    Soma = 0

    for (i = 1; i <= 10; i++)
        Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i)

    Resto = (Soma * 10) % 11

    if ((Resto == 10) || (Resto == 11))
        Resto = 0

    if (Resto != parseInt(strCPF.substring(10, 11)))
        return false

    return true
}

module.exports = { registerUserValidation, editUserValidation, verify_cpf }