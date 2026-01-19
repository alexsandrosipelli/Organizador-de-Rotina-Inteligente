// state.js - Gerenciamento de estado centralizado (VERSÃO CORRIGIDA)

import { getAllCards, getStats } from './storage.js';

/**
 * Estado global da aplicação
 */
const initialState = {
    cards: [],
    activeTab: 'rotina',
    selectedCardId: null,
    modals: {
        cardModal: false,
        linkModal: false,
        deleteModal: false
    },
    isSearchVisible: false,
    searchQuery: '',
    stats: {
        total: 0,
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
    },
    isLoading: false
};

// Estado atual da aplicação
let state = { ...initialState };

// Listeners para observar mudanças de estado (Set para evitar duplicatas)
const listeners = new Set();

/**
 * Notifica todos os listeners sobre mudanças no estado
 * @param {Object} oldState - Estado anterior
 */
function notifyListeners(oldState) {
    listeners.forEach(listener => listener(state, oldState));
}

/**
 * Comparação eficiente de objetos (shallow compare)
 */
function hasStateChanged(newState, oldState) {
    // Comparação direta para propriedades primitivas
    if (newState.activeTab !== oldState.activeTab ||
        newState.selectedCardId !== oldState.selectedCardId ||
        newState.isSearchVisible !== oldState.isSearchVisible ||
        newState.searchQuery !== oldState.searchQuery ||
        newState.isLoading !== oldState.isLoading) {
        return true;
    }

    // Comparação de arrays de cards (verifica comprimento e referência)
    if (newState.cards.length !== oldState.cards.length || 
        newState.cards !== oldState.cards) {
        return true;
    }

    // Comparação de modais
    const modalKeys = Object.keys(newState.modals);
    for (const key of modalKeys) {
        if (newState.modals[key] !== oldState.modals[key]) {
            return true;
        }
    }

    // Comparação de stats básicos
    const statKeys = ['total', 'today', 'pending', 'completed', 'overdue'];
    for (const key of statKeys) {
        if (newState.stats[key] !== oldState.stats[key]) {
            return true;
        }
    }

    return false;
}

/**
 * Retorna uma cópia do estado atual
 * @returns {Object} Estado atual
 */
export function getState() {
    return { ...state };
}

/**
 * Define um listener para mudanças de estado
 * @param {Function} callback - Função chamada quando o estado muda
 * @returns {Function} Função para remover o listener
 */
export function subscribe(callback) {
    if (typeof callback !== 'function') {
        throw new Error('Listener deve ser uma função');
    }

    listeners.add(callback);

    // Retorna função para remover o listener
    return () => listeners.delete(callback);
}

/**
 * Carrega o estado inicial da aplicação
 * @returns {Promise<Object>} Estado carregado
 */
export async function loadInitialState() {
    const oldState = { ...state };
    
    try {
        state = {
            ...state,
            isLoading: true
        };

        // Carrega todos os cards do storage
        const cards = getAllCards();

        // Atualiza estatísticas
        const stats = getStats();

        // Atualiza estado
        state = {
            ...state,
            cards,
            stats,
            isLoading: false
        };

        // Sempre notifica ao carregar estado inicial
        notifyListeners(oldState);
        return getState();

    } catch (error) {
        console.error('Erro ao carregar estado inicial:', error);
        state = {
            ...state,
            isLoading: false
        };
        notifyListeners(oldState);
        return getState();
    }
}

/**
 * Atualiza o estado de forma controlada
 * @param {Object} updates - Propriedades para atualizar
 */
function updateState(updates) {
    if (!updates || typeof updates !== 'object') {
        console.warn('Tentativa de atualizar estado com dados inválidos');
        return;
    }

    const oldState = { ...state };
    state = { ...state, ...updates };

    // Notifica listeners apenas se houver mudanças reais
    if (hasStateChanged(state, oldState)) {
        notifyListeners(oldState);
    }
}

/**
 * Define a aba ativa
 * @param {string} tabName - Nome da aba ('rotina', 'economia', 'lembretes', 'links')
 */
export function setActiveTab(tabName) {
    const validTabs = ['rotina', 'economia', 'lembretes', 'links'];

    if (!validTabs.includes(tabName)) {
        console.warn(`Tentativa de definir aba inválida: ${tabName}`);
        return;
    }

    if (state.activeTab !== tabName) {
        updateState({
            activeTab: tabName,
            selectedCardId: null,
            isSearchVisible: false,
            searchQuery: ''
        });
    }
}

/**
 * Define o card selecionado
 * @param {string|null} cardId - ID do card ou null para limpar seleção
 */
export function setSelectedCard(cardId) {
    if (cardId !== null && typeof cardId !== 'string') {
        console.warn('ID do card deve ser uma string ou null');
        return;
    }

    updateState({ selectedCardId: cardId });
}

/**
 * Atualiza os cards no estado
 * @param {Array} cards - Array de cards atualizado
 */
export function updateCards(cards) {
    if (!Array.isArray(cards)) {
        console.warn('Cards deve ser um array');
        return;
    }

    const stats = getStats();
    updateState({
        cards,
        stats,
        selectedCardId: null
    });
}

/**
 * Adiciona um novo card ao estado
 * @param {Object} cardData - Dados do novo card
 */
export function addNewCard(cardData) {
    if (!cardData || typeof cardData !== 'object') {
        console.warn('Dados do card inválidos');
        return;
    }

    const cards = [...state.cards, cardData];
    updateCards(cards);
}

/**
 * Remove um card do estado
 * @param {string} cardId - ID do card a remover
 */
export function removeCard(cardId) {
    if (!cardId || typeof cardId !== 'string') {
        console.warn('ID do card inválido');
        return;
    }

    const cards = state.cards.filter(card => card.id !== cardId);
    updateCards(cards);
}

/**
 * Atualiza um card existente
 * @param {string} cardId - ID do card a atualizar
 * @param {Object} updates - Dados para atualizar
 */
export function updateCard(cardId, updates) {
    if (!cardId || typeof cardId !== 'string') {
        console.warn('ID do card inválido');
        return;
    }

    if (!updates || typeof updates !== 'object') {
        console.warn('Dados de atualização inválidos');
        return;
    }

    const cards = state.cards.map(card => 
        card.id === cardId ? { ...card, ...updates, updatedAt: Date.now() } : card
    );
    
    updateCards(cards);
}

/**
 * Reordena os cards no estado
 * @param {string[]} cardIds - Array de IDs na nova ordem
 */
export function reorderCards(cardIds) {
    if (!Array.isArray(cardIds)) {
        console.warn('IDs de cards devem ser um array');
        return;
    }

    const cardsMap = new Map(state.cards.map(card => [card.id, card]));
    const orderedCards = [];

    // Reordena conforme array de IDs
    cardIds.forEach(cardId => {
        const card = cardsMap.get(cardId);
        if (card) {
            orderedCards.push(card);
        }
    });

    // Adiciona cards não especificados no final
    state.cards.forEach(card => {
        if (!cardIds.includes(card.id)) {
            orderedCards.push(card);
        }
    });

    updateCards(orderedCards);
}

/**
 * Retorna os cards da aba ativa
 * @returns {Array} Cards da aba ativa
 */
export function getCardsForActiveTab() {
    return state.cards.filter(card => card.tab === state.activeTab);
}

/**
 * Retorna o card atualmente selecionado
 * @returns {Object|null} Card selecionado ou null
 */
export function getSelectedCard() {
    if (!state.selectedCardId) {
        return null;
    }

    return state.cards.find(card => card.id === state.selectedCardId) || null;
}

/**
 * Controla a visibilidade de modais
 * @param {string} modalName - Nome do modal
 * @param {boolean} isVisible - Se o modal deve estar visível
 */
export function setModalVisibility(modalName, isVisible) {
    const validModals = ['cardModal', 'linkModal', 'deleteModal'];

    if (!validModals.includes(modalName)) {
        console.warn(`Modal inválido: ${modalName}`);
        return;
    }

    if (typeof isVisible !== 'boolean') {
        console.warn('Visibilidade do modal deve ser booleana');
        return;
    }

    const modals = { ...state.modals };
    modals[modalName] = isVisible;

    updateState({ 
        modals,
        // Limpa card selecionado ao fechar modal de card
        selectedCardId: (modalName === 'cardModal' && !isVisible) ? null : state.selectedCardId
    });
}

/**
 * Define a visibilidade da busca
 * @param {boolean} isVisible - Se a busca está visível
 */
export function setSearchVisibility(isVisible) {
    if (typeof isVisible !== 'boolean') {
        console.warn('Visibilidade da busca deve ser booleana');
        return;
    }

    updateState({
        isSearchVisible: isVisible,
        searchQuery: isVisible ? state.searchQuery : ''
    });
}

/**
 * Define o termo de busca
 * @param {string} query - Termo de busca
 */
export function setSearchQuery(query) {
    if (typeof query !== 'string') {
        console.warn('Termo de busca deve ser uma string');
        return;
    }

    updateState({ searchQuery: query });
}

/**
 * Filtra cards por termo de busca
 * @param {string} query - Termo de busca
 * @returns {Array} Cards filtrados
 */
export function filterCardsBySearch(query) {
    if (typeof query !== 'string') {
        return getCardsForActiveTab();
    }

    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
        return getCardsForActiveTab();
    }

    return state.cards.filter(card => {
        // Filtra por tab ativa
        if (card.tab !== state.activeTab) {
            return false;
        }

        // Busca no título
        if (card.title.toLowerCase().includes(normalizedQuery)) {
            return true;
        }

        // Busca na categoria
        if (card.category && card.category.toLowerCase().includes(normalizedQuery)) {
            return true;
        }

        return false;
    });
}

/**
 * Limpa o termo de busca
 */
export function clearSearch() {
    updateState({
        searchQuery: '',
        isSearchVisible: false
    });
}

/**
 * Reseta o estado para os valores iniciais (mantém cards do storage)
 */
export function resetState() {
    const cards = getAllCards();
    const stats = getStats();
    const oldState = { ...state };

    state = {
        ...initialState,
        cards,
        stats
    };

    if (hasStateChanged(state, oldState)) {
        notifyListeners(oldState);
    }
}

/**
 * Retorna as estatísticas atualizadas
 * @returns {Object} Estatísticas
 */
export function refreshStats() {
    const stats = getStats();
    updateState({ stats });
    return stats;
}