const { connectDB } = require("./../connectiondb");
const { ObjectId } = require('mongodb');

const collection_name = "teste2";

/**
 * Sanitiza e valida o termo de pesquisa para prevenir NoSQL injection
 * @param {string} searchTerm - Termo de pesquisa
 * @returns {Object} - { isValid: boolean, sanitizedTerm: string, error?: string }
 */
function sanitizeSearchTerm(searchTerm) {
    // Verificações básicas
    if (!searchTerm || typeof searchTerm !== 'string') {
        return { isValid: false, sanitizedTerm: '', error: 'Termo de pesquisa inválido' };
    }

    // Remove espaços extras e converte para string
    const trimmed = searchTerm.trim();
    
    // Verifica se está vazio após trim
    if (trimmed.length === 0) {
        return { isValid: false, sanitizedTerm: '', error: 'Termo de pesquisa não pode estar vazio' };
    }

    // Limita o tamanho para prevenir DoS
    if (trimmed.length > 100) {
        return { isValid: false, sanitizedTerm: '', error: 'Termo de pesquisa muito longo (máximo 100 caracteres)' };
    }

    // Remove caracteres perigosos para NoSQL injection
    const dangerousChars = /[$]|[{]|[}]|[\\]|[\^]|[.]|[*]|[+]|[?]|[|]|[(]|[)]|[[\]]/g;
    const sanitized = trimmed.replace(dangerousChars, '');
    
    // Se após sanitização ficou muito pequeno, rejeita
    if (sanitized.length < 2) {
        return { isValid: false, sanitizedTerm: '', error: 'Termo de pesquisa muito curto após sanitização' };
    }

    // Verifica se contém apenas caracteres alfanuméricos, espaços e alguns símbolos seguros
    const safePattern = /^[a-zA-Z0-9\s@._-]+$/;
    if (!safePattern.test(sanitized)) {
        return { isValid: false, sanitizedTerm: '', error: 'Termo de pesquisa contém caracteres não permitidos' };
    }

    return { isValid: true, sanitizedTerm: sanitized };
}

/**
 * Cria uma regex segura escapando caracteres especiais
 * @param {string} term - Termo sanitizado
 * @returns {RegExp} - Regex segura
 */
function createSafeRegex(term) {
    // Escapa caracteres especiais da regex
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
}

/**
 * Pesquisa usuários por qualquer campo (nome, username, link, etc.)
 * @param {string} searchTerm - Termo de pesquisa
 * @returns {Promise<Array>} - Array de usuários encontrados
 */
async function searchUsers(searchTerm) {
    try {
        // Sanitiza e valida o termo de pesquisa
        const validation = sanitizeSearchTerm(searchTerm);
        if (!validation.isValid) {
            console.warn('🚨 Tentativa de pesquisa com termo inválido:', searchTerm, 'Erro:', validation.error);
            return [];
        }

        const db = await connectDB();
        const searchRegex = createSafeRegex(validation.sanitizedTerm);

        // Busca em múltiplos campos usando $or com proteção contra injection
        const users = await db.collection(collection_name).find({
            $or: [
                { dc_username: searchRegex },
                { username: searchRegex },
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { cpf: searchRegex },
                { pixkey: searchRegex },
                // Busca em social_networks (que é um objeto com chaves como facebook, instagram, etc.)
                { "social_networks.facebook": searchRegex },
                { "social_networks.instagram": searchRegex },
                { "social_networks.youtube": searchRegex },
                { "social_networks.tiktok": searchRegex },
                { "social_networks.kawai": searchRegex }
            ]
        }).toArray();

        return users.map(user => ({
            id: user._id.toString(),
            dc_username: user.dc_username || '(sem nome)',
            username: user.username || '',
            name: user.name || '',
            email: user.email || '',
            social_networks: user.social_networks || []
        }));

    } catch (error) {
        console.error('Erro ao pesquisar usuários:', error);
        throw new Error('Erro interno ao pesquisar usuários');
    }
}

/**
 * Pesquisa um usuário específico por ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} - Usuário encontrado ou null
 */
async function getUserById(userId) {
    try {
        const db = await connectDB();
        const user = await db.collection(collection_name).findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            dc_username: user.dc_username || '(sem nome)',
            username: user.username || '',
            name: user.name || '',
            email: user.email || '',
            social_networks: user.social_networks || [],
            ...user // Inclui todos os outros campos
        };

    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error);
        throw new Error('Erro interno ao buscar usuário');
    }
}

module.exports = { searchUsers, getUserById };
