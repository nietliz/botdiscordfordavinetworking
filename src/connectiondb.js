const { MongoClient, ServerApiVersion } = require('mongodb');

const dotenv = require('dotenv');
dotenv.config();

const client = new MongoClient(process.env.URI_DB, {serverApi: {version: ServerApiVersion.v1,strict: true,deprecationErrors: true,}});

async function connectDB() {
    console.log('funfei')
    try {
        await client.connect();
        const db = client.db(process.env.DB);
        await db.command({ ping: 1 });
        console.log("MongoDB: Conexão Atlas estabelecida com sucesso.");
        return db; 
    } catch (error) {
        console.error("MongoDB: Erro grave na conexão!", error);
        await client.close(); 
        process.exit(1); 
    }
}

module.exports = { connectDB };