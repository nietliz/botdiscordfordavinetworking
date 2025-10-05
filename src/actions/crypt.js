const crypto = require('crypto');

const KEY_CRIPT = process.env.KEY_CRIPT || 'sua_chave_padrao_32_caracteres';

/**
 * Criptografa um texto usando AES-256-CBC
 * @param {string} text - Texto a ser criptografado
 * @returns {string} - Texto criptografado em formato base64
 */
function encrypt(text) {
    if (!text) return '';
    
    try {
        // Gera um IV (Initialization Vector) aleatório
        const iv = crypto.randomBytes(16);
        
        // Cria a chave a partir da string (32 bytes para AES-256)
        const key = crypto.scryptSync(KEY_CRIPT, 'salt', 32);
        
        // Cria o cipher
        const cipher = crypto.createCipher('aes-256-cbc', key);
        
        // Criptografa o texto
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Combina IV + texto criptografado e converte para base64
        const combined = iv.toString('hex') + ':' + encrypted;
        return Buffer.from(combined).toString('base64');
        
    } catch (error) {
        console.error('Erro ao criptografar:', error);
        return '';
    }
}

/**
 * Descriptografa um texto criptografado
 * @param {string} encryptedText - Texto criptografado em base64
 * @returns {string} - Texto descriptografado
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    
    try {
        // Decodifica do base64
        const combined = Buffer.from(encryptedText, 'base64').toString('utf8');
        
        // Separa IV e texto criptografado
        const parts = combined.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato inválido');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        // Cria a chave a partir da string (32 bytes para AES-256)
        const key = crypto.scryptSync(KEY_CRIPT, 'salt', 32);
        
        // Cria o decipher
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        
        // Descriptografa o texto
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
        
    } catch (error) {
        console.error('Erro ao descriptografar:', error);
        return '';
    }
}

module.exports = {
    encrypt,
    decrypt
};
