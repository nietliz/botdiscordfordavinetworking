// ========================================
// APP.JS - INICIALIZADOR SIMPLES
// ========================================

// Carrega variáveis de ambiente
require('dotenv').config();

console.log('🚀 Iniciando aplicação...');

// ========================================
// INICIA BOT DISCORD
// ========================================
console.log('🤖 Iniciando Bot Discord...');
const { client } = require('./src/index');

// ========================================
// INICIA SERVIDOR WEB
// ========================================
console.log('🌐 Iniciando Servidor Web...');
require('./src/server');

// ========================================
// LOGS DE STATUS
// ========================================
console.log('✅ Aplicação iniciada com sucesso!');
console.log('📱 Bot Discord: Conectando...');
console.log('🌐 Servidor Web: http://localhost:3000');

// ========================================
// TRATAMENTO DE ERROS
// ========================================
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});

// Exporta para compatibilidade
module.exports = { client };
