const { connectDB } = require("../connectiondb");
const { registerUserValidation, editUserValidation } = require("./validations");

const collection_name = "message_default";

async function VerifyMsg() {
    const cluster = await connectDB();
    const msgs_db = cluster.collection(collection_name).find(); 
    const cursorr= await msgs_db.toArray()
    // O msgs_db agora será um Array ([]) se não houver registros.
    if (cursorr.length > 0) {
        // console.log(cursorr)
        console.log("tem uma mensagem");
        return 1;
    } else {
        console.log('não tem mensagens default');
        return 0;
    }

}

async function AddMsg(msg) {
    try {
        const cluster = await connectDB();
        cluster.collection(collection_name).insertOne(msg);
        console.log("mensagem adicionada")
        return true;
    } catch (err) {
        console.log("falha na adição da mensagem")
        return false;
    }
}


module.exports = {AddMsg,VerifyMsg}