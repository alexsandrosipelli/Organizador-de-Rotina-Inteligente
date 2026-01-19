// utils.js - Utilitários puros para o Organizador de Rotina (VERSÃO CORRIGIDA)

/**
 * Gera um ID único para novos cards
 * @returns {string} ID único no formato 'card-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
 */
export function generateId() {
    return 'card-' + crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return 'Data inválida';
    }

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Formata data para input type="date" (YYYY-MM-DD)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 * @returns {string} Data atual formatada
 */
export function getToday() {
    const today = new Date();
    return formatDateForInput(today);
}

/**
 * Verifica se uma data é hoje
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se for hoje
 */
export function isToday(date) {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    if (isNaN(d.getTime())) {
        return false;
    }

    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
}

/**
 * Verifica se uma data é passada (antes de hoje)
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se for passada
 */
export function isPastDate(date) {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    if (isNaN(d.getTime())) {
        return false;
    }

    // Reseta horas para comparar apenas datas
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return dateOnly < todayOnly;
}

/**
 * Verifica se uma data está no futuro (depois de hoje)
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se for futura
 */
export function isFutureDate(date) {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    if (isNaN(d.getTime())) {
        return false;
    }

    // Reseta horas para comparar apenas datas
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return dateOnly > todayOnly;
}

/**
 * Calcula quantos dias faltam até uma data
 * @param {Date|string} date - Data alvo
 * @returns {number} Dias restantes (negativo se passou)
 */
export function daysUntil(date) {
    if (!date) return Infinity;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    if (isNaN(d.getTime())) {
        return Infinity;
    }

    // Reseta horas para comparar apenas datas
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = dateOnly - todayOnly;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Retorna uma descrição amigável para os dias restantes
 * @param {number} days - Quantidade de dias
 * @returns {string} Descrição amigável
 */
export function getDaysDescription(days) {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    if (days === -1) return 'Ontem';
    if (days > 0) return `Em ${days} dias`;
    if (days < 0) return `Há ${Math.abs(days)} dias`;
    return 'Sem data';
}

/**
 * Formata a data atual para exibição no header
 * @returns {string} Data formatada com dia da semana
 */
export function getCurrentDateFormatted() {
    const now = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    return now.toLocaleDateString('pt-BR', options);
}

/**
 * Debounce para otimizar eventos frequentes
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Clamp: restringe um valor entre mínimo e máximo
 * @param {number} value - Valor a ser restringido
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Valor restringido
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Escapa strings HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto seguro para HTML
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Valida se uma string é uma URL válida
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se for uma URL válida
 */
export function isValidUrl(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;

    try {
        const parsedUrl = new URL(url);
        // Suporta http, https e protocolos customizados como app://
        return parsedUrl.protocol === 'http:' ||
            parsedUrl.protocol === 'https:' ||
            parsedUrl.protocol === 'app:' ||
            parsedUrl.protocol === 'intent:';
    } catch {
        return false;
    }
}

/**
 * Normaliza uma string para comparação (remove acentos, lowercase)
 * @param {string} str - String a ser normalizada
 * @returns {string} String normalizada
 */
export function normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Ordena um array de objetos por data
 * @param {Array} array - Array a ser ordenado
 * @param {string} dateField - Campo de data no objeto
 * @param {boolean} ascending - Ordem crescente (true) ou decrescente (false)
 * @returns {Array} Array ordenado
 */
export function sortByDate(array, dateField = 'date', ascending = true) {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
        const dateA = new Date(a[dateField] || 0);
        const dateB = new Date(b[dateField] || 0);

        return ascending ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Filtra um array por status
 * @param {Array} array - Array a ser filtrado
 * @param {string} statusField - Campo de status
 * @param {string} status - Status desejado
 * @returns {Array} Array filtrado
 */
export function filterByStatus(array, statusField = 'status', status) {
    if (!Array.isArray(array)) return [];
    
    return array.filter(item => item[statusField] === status);
}

/**
 * Agrupa cards por categoria
 * @param {Array} cards - Array de cards
 * @returns {Object} Cards agrupados por categoria
 */
export function groupByCategory(cards) {
    if (!Array.isArray(cards)) return {};
    
    return cards.reduce((groups, card) => {
        const category = card.category || 'sem-categoria';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(card);
        return groups;
    }, {});
}

/**
 * Retorna um array de categorias disponíveis
 * @returns {Array} Lista de categorias
 */
export function getAvailableCategories() {
    return [
        { value: 'trabalho', label: 'Trabalho' },
        { value: 'pessoal', label: 'Pessoal' },
        { value: 'saude', label: 'Saúde' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'casa', label: 'Casa' },
        { value: 'outro', label: 'Outro' }
    ];
}

/**
 * Retorna um array de status disponíveis
 * @returns {Array} Lista de status
 */
export function getAvailableStatus() {
    return [
        { value: 'pendente', label: 'Pendente' },
        { value: 'concluido', label: 'Concluído' },
        { value: 'vencido', label: 'Vencido' }
    ];
}

/**
 * Retorna um array de prioridades disponíveis
 * @returns {Array} Lista de prioridades
 */
export function getAvailablePriorities() {
    return [
        { value: 'baixa', label: 'Baixa' },
        { value: 'media', label: 'Média' },
        { value: 'alta', label: 'Alta' }
    ];
}

/**
 * Retorna a cor correspondente a um status
 * @param {string} status - Status do card
 * @returns {string} Cor do status
 */
export function getStatusColor(status) {
    const colors = {
        'pendente': 'warning',
        'concluido': 'success',
        'vencido': 'error'
    };
    return colors[status] || 'gray';
}

/**
 * Retorna a cor correspondente a uma prioridade
 * @param {string} priority - Prioridade do card
 * @returns {string} Cor da prioridade
 */
export function getPriorityColor(priority) {
    const colors = {
        'baixa': 'success',
        'media': 'warning',
        'alta': 'error'
    };
    return colors[priority] || 'gray';
}

/**
 * Capitaliza a primeira letra de uma string
 * @param {string} str - String a ser capitalizada
 * @returns {string} String capitalizada
 */
export function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Retorna a data de amanhã
 * @returns {Date} Data de amanhã
 */
export function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

/**
 * Retorna a data de uma semana a partir de hoje
 * @returns {Date} Data da próxima semana
 */
export function getNextWeek() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
}

/**
 * Extrai o domínio de uma URL para exibição
 * @param {string} url - URL completa
 * @returns {string} Domínio da URL
 */
export function getDomainFromUrl(url) {
    if (!url || typeof url !== 'string') return 'App';
    
    try {
        if (url.startsWith('app://') || url.startsWith('intent://')) {
            return 'App móvel';
        }
        
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Link rápido';
    }
}

/**
 * Obtém o dia da semana em português
 * @param {Date|string} date - Data
 * @param {boolean} short - Formato curto
 * @returns {string} Dia da semana
 */
export function getWeekday(date, short = false) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '';
    
    const weekdays = short 
        ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return weekdays[d.getDay()];
}

/**
 * Formata hora para exibição
 * @param {Date|string} date - Data/hora
 * @returns {string} Hora formatada
 */
export function formatTime(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Verifica se um valor é vazio (null, undefined, string vazia, array vazio)
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se vazio
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Cria um delay promise
 * @param {number} ms - Milisegundos
 * @returns {Promise} Promise que resolve após o delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Remove duplicatas de um array por propriedade
 * @param {Array} array - Array
 * @param {string} key - Chave para verificar duplicatas
 * @returns {Array} Array sem duplicatas
 */
export function removeDuplicates(array, key = 'id') {
    if (!Array.isArray(array)) return [];
    
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}