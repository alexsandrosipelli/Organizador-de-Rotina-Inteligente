// storage.js - Camada de abstração do LocalStorage

import { generateId, getAvailableCategories, getAvailableStatus, getAvailablePriorities } from './utils.js';

// Constantes
const STORAGE_KEY = 'organizador-rotina-cards';
const BACKUP_KEY = 'organizador-rotina-backup';

/**
 * Estrutura padrão de um card
 * @typedef {Object} Card
 * @property {string} id - ID único do card
 * @property {string} title - Título do card
 * @property {string} date - Data no formato YYYY-MM-DD
 * @property {string} category - Categoria do card
 * @property {string} status - Status: 'pendente', 'concluido', 'vencido'
 * @property {string} priority - Prioridade: 'baixa', 'media', 'alta'
 * @property {string} link - URL ou deep link do app/serviço
 * @property {string} tab - Aba onde o card pertence
 * @property {number} createdAt - Timestamp de criação
 * @property {number} updatedAt - Timestamp de última atualização
 * @property {number} order - Ordem de exibição
 */

/**
 * Retorna todos os cards do LocalStorage
 * @returns {Card[]} Array de cards
 */
export function getAllCards() {
    try {
        const cardsJson = localStorage.getItem(STORAGE_KEY);

        if (!cardsJson) {
            // Retorna array vazio se não houver dados
            return [];
        }

        const parsedCards = JSON.parse(cardsJson);

        // Valida se é um array
        if (!Array.isArray(parsedCards)) {
            console.error('Dados corrompidos: não é um array', parsedCards);
            return [];
        }

        // Filtra itens inválidos
        const validCards = parsedCards.filter(card => {
            return card &&
                typeof card === 'object' &&
                card.id &&
                typeof card.id === 'string' &&
                card.title &&
                typeof card.title === 'string';
        });

        // Ordena por ordem, depois por data de criação
        return validCards.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

    } catch (error) {
        console.error('Erro ao recuperar cards do LocalStorage:', error);
        return [];
    }
}

/**
 * Retorna um card específico pelo ID
 * @param {string} cardId - ID do card
 * @returns {Card|null} Card encontrado ou null
 */
export function getCardById(cardId) {
    if (!cardId || typeof cardId !== 'string') {
        return null;
    }

    const cards = getAllCards();
    return cards.find(card => card.id === cardId) || null;
}

/**
 * Retorna cards filtrados por aba
 * @param {string} tabName - Nome da aba ('rotina', 'economia', 'lembretes', 'links')
 * @returns {Card[]} Cards da aba especificada
 */
export function getCardsByTab(tabName) {
    const validTabs = ['rotina', 'economia', 'lembretes', 'links'];

    if (!validTabs.includes(tabName)) {
        console.warn(`Aba inválida: ${tabName}`);
        return [];
    }

    const cards = getAllCards();
    return cards.filter(card => card.tab === tabName);
}

/**
 * Retorna cards filtrados por status
 * @param {string} status - Status do card
 * @returns {Card[]} Cards com o status especificado
 */
export function getCardsByStatus(status) {
    const validStatus = getAvailableStatus().map(s => s.value);

    if (!validStatus.includes(status)) {
        console.warn(`Status inválido: ${status}`);
        return [];
    }

    const cards = getAllCards();
    return cards.filter(card => card.status === status);
}

/**
 * Cria e salva um novo card
 * @param {Object} cardData - Dados do card (sem ID)
 * @returns {Card|null} Card criado ou null em caso de erro
 */
export function saveCard(cardData) {
    try {
        // Valida dados mínimos
        if (!cardData || typeof cardData !== 'object') {
            throw new Error('Dados do card inválidos');
        }

        if (!cardData.title || cardData.title.trim() === '') {
            throw new Error('Título é obrigatório');
        }

        // Valida categoria
        const validCategories = getAvailableCategories().map(c => c.value);
        if (cardData.category && !validCategories.includes(cardData.category)) {
            cardData.category = 'outro';
        }

        // Valida status
        const validStatus = getAvailableStatus().map(s => s.value);
        if (!cardData.status || !validStatus.includes(cardData.status)) {
            cardData.status = 'pendente';
        }

        // Valida prioridade
        const validPriorities = getAvailablePriorities().map(p => p.value);
        if (!cardData.priority || !validPriorities.includes(cardData.priority)) {
            cardData.priority = 'media';
        }

        // Valida aba
        const validTabs = ['rotina', 'economia', 'lembretes', 'links'];
        if (!cardData.tab || !validTabs.includes(cardData.tab)) {
            cardData.tab = 'rotina';
        }

        // Cria card completo
        const timestamp = Date.now();
        const cards = getAllCards();

        const newCard = {
            id: generateId(),
            title: cardData.title.trim(),
            date: cardData.date || '',
            category: cardData.category,
            status: cardData.status,
            priority: cardData.priority,
            link: cardData.link || '',
            tab: cardData.tab,
            createdAt: timestamp,
            updatedAt: timestamp,
            order: cards.length // Adiciona no final
        };

        // Adiciona ao array e salva
        cards.push(newCard);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));

        return newCard;

    } catch (error) {
        console.error('Erro ao salvar card:', error);
        return null;
    }
}

/**
 * Atualiza um card existente
 * @param {string} cardId - ID do card a ser atualizado
 * @param {Object} updates - Dados a serem atualizados
 * @returns {Card|null} Card atualizado ou null em caso de erro
 */
export function updateCard(cardId, updates) {
    try {
        if (!cardId || typeof cardId !== 'string') {
            throw new Error('ID do card inválido');
        }

        if (!updates || typeof updates !== 'object') {
            throw new Error('Dados de atualização inválidos');
        }

        const cards = getAllCards();
        const cardIndex = cards.findIndex(card => card.id === cardId);

        if (cardIndex === -1) {
            throw new Error(`Card não encontrado: ${cardId}`);
        }

        // Remove campos que não devem ser atualizados
        const { id, createdAt, ...safeUpdates } = updates;

        // Valida campos específicos
        if (safeUpdates.category) {
            const validCategories = getAvailableCategories().map(c => c.value);
            if (!validCategories.includes(safeUpdates.category)) {
                safeUpdates.category = 'outro';
            }
        }

        if (safeUpdates.status) {
            const validStatus = getAvailableStatus().map(s => s.value);
            if (!validStatus.includes(safeUpdates.status)) {
                safeUpdates.status = 'pendente';
            }
        }

        if (safeUpdates.priority) {
            const validPriorities = getAvailablePriorities().map(p => p.value);
            if (!validPriorities.includes(safeUpdates.priority)) {
                safeUpdates.priority = 'media';
            }
        }

        if (safeUpdates.tab) {
            const validTabs = ['rotina', 'economia', 'lembretes', 'links'];
            if (!validTabs.includes(safeUpdates.tab)) {
                safeUpdates.tab = 'rotina';
            }
        }

        // Atualiza card
        const updatedCard = {
            ...cards[cardIndex],
            ...safeUpdates,
            updatedAt: Date.now()
        };

        // Trata título vazio
        if (updatedCard.title && updatedCard.title.trim() !== '') {
            updatedCard.title = updatedCard.title.trim();
        }

        cards[cardIndex] = updatedCard;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));

        return updatedCard;

    } catch (error) {
        console.error('Erro ao atualizar card:', error);
        return null;
    }
}

/**
 * Remove um card pelo ID
 * @param {string} cardId - ID do card a ser removido
 * @returns {boolean} True se removido com sucesso
 */
export function deleteCard(cardId) {
    try {
        if (!cardId || typeof cardId !== 'string') {
            throw new Error('ID do card inválido');
        }

        const cards = getAllCards();
        const initialLength = cards.length;

        const filteredCards = cards.filter(card => card.id !== cardId);

        if (filteredCards.length === initialLength) {
            // Card não encontrado
            return false;
        }

        // Reordena os cards restantes
        filteredCards.forEach((card, index) => {
            card.order = index;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCards));
        return true;

    } catch (error) {
        console.error('Erro ao deletar card:', error);
        return false;
    }
}

/**
 * Atualiza a ordem dos cards
 * @param {string[]} cardIds - Array de IDs na nova ordem
 * @returns {boolean} True se ordenado com sucesso
 */
export function reorderCards(cardIds) {
    try {
        if (!Array.isArray(cardIds)) {
            throw new Error('IDs devem ser um array');
        }

        const cards = getAllCards();
        const cardMap = new Map(cards.map(card => [card.id, card]));

        // Atualiza ordem
        cardIds.forEach((cardId, index) => {
            const card = cardMap.get(cardId);
            if (card) {
                card.order = index;
                card.updatedAt = Date.now();
            }
        });

        // Mantém cards que não estão no array de ordenação
        cards.forEach(card => {
            if (!cardIds.includes(card.id)) {
                card.order = cards.length + card.order;
            }
        });

        // Ordena e salva
        cards.sort((a, b) => a.order - b.order);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));

        return true;

    } catch (error) {
        console.error('Erro ao reordenar cards:', error);
        return false;
    }
}

/**
 * Remove todos os cards (limpa LocalStorage)
 * @returns {boolean} True se limpo com sucesso
 */
export function clearAllCards() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Erro ao limpar cards:', error);
        return false;
    }
}

/**
 * Cria um backup dos dados atuais
 * @returns {Object|null} Dados do backup ou null em caso de erro
 */
export function createBackup() {
    try {
        const cards = getAllCards();
        const backupData = {
            timestamp: Date.now(),
            count: cards.length,
            cards: cards
        };

        localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
        return backupData;

    } catch (error) {
        console.error('Erro ao criar backup:', error);
        return null;
    }
}

/**
 * Restaura dados do backup
 * @returns {boolean} True se restaurado com sucesso
 */
export function restoreFromBackup() {
    try {
        const backupJson = localStorage.getItem(BACKUP_KEY);

        if (!backupJson) {
            throw new Error('Nenhum backup encontrado');
        }

        const backupData = JSON.parse(backupJson);

        if (!backupData || !Array.isArray(backupData.cards)) {
            throw new Error('Dados de backup inválidos');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(backupData.cards));
        return true;

    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        return false;
    }
}

/**
 * Retorna estatísticas dos cards
 * @returns {Object} Estatísticas
 */
export function getStats() {
    const cards = getAllCards();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = {
        total: cards.length,
        today: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
        byTab: {
            rotina: 0,
            economia: 0,
            lembretes: 0,
            links: 0
        }
    };

    cards.forEach(card => {
        // Contagem por status
        if (card.status === 'pendente') stats.pending++;
        if (card.status === 'concluido') stats.completed++;
        if (card.status === 'vencido') stats.overdue++;

        // Contagem por aba
        if (stats.byTab.hasOwnProperty(card.tab)) {
            stats.byTab[card.tab]++;
        }

        // Contagem para hoje
        if (card.date) {
            const cardDate = new Date(card.date);
            const cardDateOnly = new Date(cardDate.getFullYear(), cardDate.getMonth(), cardDate.getDate());

            if (cardDateOnly.getTime() === today.getTime()) {
                stats.today++;
            }
        }
    });

    return stats;
}

/**
 * Exporta todos os cards como JSON para download
 * @returns {string|null} JSON string ou null em caso de erro
 */
export function exportCards() {
    try {
        const cards = getAllCards();
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            count: cards.length,
            cards: cards
        };

        return JSON.stringify(exportData, null, 2);

    } catch (error) {
        console.error('Erro ao exportar cards:', error);
        return null;
    }
}

/**
 * Importa cards de um JSON
 * @param {string} jsonString - String JSON contendo os cards
 * @returns {Object} Resultado da importação
 */
export function importCards(jsonString) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('JSON inválido');
        }

        const importData = JSON.parse(jsonString);

        if (!importData || !Array.isArray(importData.cards)) {
            throw new Error('Formato de importação inválido');
        }

        const existingCards = getAllCards();
        const importedCards = [];
        const skippedCards = [];

        // Processa cada card importado
        importData.cards.forEach(card => {
            // Valida card básico
            if (!card.id || !card.title) {
                skippedCards.push(card);
                return;
            }

            // Verifica se já existe
            const exists = existingCards.some(existing => existing.id === card.id);

            if (exists) {
                skippedCards.push(card);
                return;
            }

            // Adiciona timestamp se não existir
            if (!card.createdAt) {
                card.createdAt = Date.now();
            }

            if (!card.updatedAt) {
                card.updatedAt = Date.now();
            }

            // Define ordem
            card.order = existingCards.length + importedCards.length;

            importedCards.push(card);
        });

        // Salva todos os cards
        const allCards = [...existingCards, ...importedCards];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allCards));

        return {
            success: true,
            imported: importedCards.length,
            skipped: skippedCards.length,
            total: allCards.length
        };

    } catch (error) {
        console.error('Erro ao importar cards:', error);
        return {
            success: false,
            error: error.message,
            imported: 0,
            skipped: 0,
            total: 0
        };
    }
}