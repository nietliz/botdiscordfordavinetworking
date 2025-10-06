const { connectDB } = require("./../connectiondb");
const { registerUserValidation, editUserValidation } = require("./validations");

const collection_name= "teste2";

async function Verific() {
    const cluster = await connectDB();
    const test = cluster.collection(collection_name).find();
    const results = await test.toArray();

    console.log("Documentos encontrados:", results);
}

async function AddUser(user) {
    try {
        const [valided, status] = registerUserValidation(user);
        if (valided) {
            const cluster = await connectDB();
            cluster.collection(collection_name).insertOne(user);
            return {status:true,message:`**✅ Primeiro passo feito com sucesso.**\n _⚠ para finalizar sua inscrição, complete seu cadastro com o comando /passo-final._`};
        } else {
            return {status:true,message:`**❌ Erro: ${status}**`};
        }

    } catch (err) {
        return {status:true,message:`**❌ Erro: ${err}**`};
    }
}

async function EditUser(filter,changes) {
    try {
        
        const [valided, status] = editUserValidation(changes);
        if (valided) {
            const cluster = await connectDB();
            cluster.collection(collection_name).updateOne(filter,{$set:{social_networks:changes}}); //depois preciso trocar de teste para users
            return {status:true,message:`**✅ Parabéns! Sua inscrição foi finalizada com sucesso 💸.**`};
        } else {
            console.log("estamos aqui?")
            return {status:true,message:`**❌ Erro: ${status}**`};
        }
    } catch (err) {
        return {status:false,message:`**❌ Erro: ${err}**`};
    }
}

async function VerifyExist(userid){
    const cluster = await connectDB();
    const user= await cluster.collection(collection_name).findOne({dc_username:userid}); //depois preciso trocar de teste para users
    if((user != "") && (user != null) && (user != {})){
        console.log("aquiiiasdasdasdi:",user)
        return 1;
    }else{
        console.log('deu B.O')
        return 0;
    }
    
}

async function VerifyExistTwo(userid){
    const cluster = await connectDB();
    const user= await cluster.collection(collection_name).findOne({dc_username:userid}); //depois preciso trocar de teste para users
    if((user != "") && (user != null) && (user != {})){
        if(user.social_networks.ok){
            return 1;
        }else{
            return 0;
        }
        
    }else{
        return 0;
    }
    
}

module.exports = { Verific, AddUser, EditUser,VerifyExist, VerifyExistTwo }