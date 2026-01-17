// cards.js - Manipulação e renderização de cards

import {
    formatDate,
    isToday,
    isPastDate,
    getDaysDescription,
    daysUntil,
    capitalize,
    getStatusColor,
    getPriorityColor
} from './utils.js';
import {
    saveCard,
    updateCard,
    deleteCard,
    reorderCards as reorderCardsInStorage,
    getCardsByTab
} from './storage.js';
import {
    getState,
    updateCards,
    setSelectedCard,
    setModalVisibility,
    getCardsForActiveTab,
    filterCardsBySearch
} from './state.js';

/**
 * Renderiza todos os cards da aba ativa
 * @param {Array} cards - Cards para renderizar (opcional, busca do state se não fornecido)
 */
export function renderCards(cards = null) {
    const state = getState();
    const cardsToRender = cards || getCardsForActiveTab();

    // Limpa containers
    clearAllCardContainers();

    // Renderiza cards para cada container
    renderTabCards('rotina', cardsToRender);
    renderTabCards('economia', cardsToRender);
    renderTabCards('lembretes', cardsToRender);
    renderTabCards('links', cardsToRender);

    // Atualiza contadores
    updateBadgeCounts();

    // Atualiza empty states
    updateEmptyStates();

    // Adiciona eventos de drag and drop
    initDragAndDrop();
}

/**
 * Limpa todos os containers de cards
 */
function clearAllCardContainers() {
    const containers = [
        'rotinaCards',
        'economiaCards',
        'lembretesCards',
        'linksContainer'
    ];

    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    });
}

/**
 * Renderiza cards para uma aba específica
 * @param {string} tabName - Nome da aba
 * @param {Array} allCards - Todos os cards
 */
function renderTabCards(tabName, allCards) {
    const containerId = `${tabName}Cards`;
    const container = document.getElementById(containerId);

    if (!container) return;

    // Filtra cards da aba
    const tabCards = allCards.filter(card => card.tab === tabName);

    if (tabName === 'links') {
        // Renderiza links como itens especiais
        renderLinkItems(tabCards, container);
    } else {
        // Renderiza cards normais
        tabCards.forEach(card => {
            const cardElement = createCardElement(card);
            container.appendChild(cardElement);
        });
    }
}

/**
 * Cria um elemento de card para o DOM
 * @param {Object} card - Dados do card
 * @returns {HTMLElement} Elemento do card
 */
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.id = `card-${card.id}`;
    cardElement.dataset.cardId = card.id;
    cardElement.draggable = true;

    // Adiciona classes condicionais
    if (isToday(card.date)) {
        cardElement.classList.add('today');
    }

    if (card.status === 'vencido' || (card.status === 'pendente' && isPastDate(card.date))) {
        cardElement.classList.add('overdue');
    }

    // Gera o HTML do card
    cardElement.innerHTML = `
        <div class="card-status ${card.status}"></div>
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(card.title)}</h3>
            <div class="card-actions">
                <button class="card-action-btn edit" data-action="edit" aria-label="Editar">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 5l4 4m-6-6L4 14l-4 4 4-4 9-9z"/>
                    </svg>
                </button>
                <button class="card-action-btn delete" data-action="delete" aria-label="Excluir">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h14M5 6V4a2 2 0 012-2h6a2 2 0 012 2v2m-3 0v10M9 6v10"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="card-body">
            <div class="card-meta">
                ${card.date ? `
                    <div class="meta-item">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8a9 9 0 11-9-9m9 9H3m9 0l-3-3m3 3l-3 3"/>
                        </svg>
                        <span>${getDateInfo(card)}</span>
                    </div>
                ` : ''}
                ${card.category ? `
                    <div class="meta-item">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 4h10M7 10h10M7 16h10M3 4h.01M3 10h.01M3 16h.01"/>
                        </svg>
                        <span>${capitalize(card.category)}</span>
                    </div>
                ` : ''}
            </div>
            ${card.priority ? `
                <span class="card-priority ${card.priority}">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 6a6 6 0 11-12 0 6 6 0 0112 0z"/>
                    </svg>
                    ${capitalize(card.priority)}
                </span>
            ` : ''}
            ${card.status ? `
                <span class="card-priority ${getStatusColor(card.status)}">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 6a6 6 0 11-12 0 6 6 0 0112 0z"/>
                    </svg>
                    ${capitalize(card.status)}
                </span>
            ` : ''}
            ${card.link ? `
                <div class="card-link" data-action="open-link">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                    <span>Abrir app/serviço</span>
                </div>
            ` : ''}
        </div>
        <div class="card-footer">
            <span class="card-date">Criado em ${formatDate(new Date(card.createdAt))}</span>
        </div>
    `;

    // Adiciona eventos
    addCardEventListeners(cardElement, card);

    return cardElement;
}

/**
 * Renderiza itens de link especiais
 * @param {Array} linkCards - Cards do tipo link
 * @param {HTMLElement} container - Container para renderizar
 */
function renderLinkItems(linkCards, container) {
    linkCards.forEach(card => {
        const linkElement = createLinkElement(card);
        container.appendChild(linkElement);
    });
}

/**
 * Cria um elemento de link especial
 * @param {Object} card - Dados do card (tipo link)
 * @returns {HTMLElement} Elemento do link
 */
function createLinkElement(card) {
    const linkElement = document.createElement('div');
    linkElement.className = 'link-item';
    linkElement.id = `link-${card.id}`;
    linkElement.dataset.cardId = card.id;

    const domain = card.link ? getDomainFromUrl(card.link) : 'App';
    const title = card.title || 'Link rápido';

    linkElement.innerHTML = `
        <div class="link-item-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
        </div>
        <h4 class="link-item-title">${escapeHtml(title)}</h4>
        <div class="link-item-url">${escapeHtml(domain)}</div>
    `;

    // Adiciona eventos
    if (card.link) {
        linkElement.addEventListener('click', () => {
            setSelectedCard(card.id);
            showLinkModal(card);
        });

        // Menu de contexto para editar/excluir
        linkElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, card);
        });
    }

    linkElement.addEventListener('click', (e) => {
        if (!e.target.closest('.link-item')) return;
        setSelectedCard(card.id);
        // Se não tem link, abre para edição
        if (!card.link) {
            openEditCardModal(card);
        }
    });

    return linkElement;
}

/**
 * Adiciona event listeners a um elemento de card
 * @param {HTMLElement} cardElement - Elemento do card
 * @param {Object} card - Dados do card
 */
function addCardEventListeners(cardElement, card) {
    // Editar card
    const editBtn = cardElement.querySelector('[data-action="edit"]');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedCard(card.id);
            openEditCardModal(card);
        });
    }

    // Excluir card
    const deleteBtn = cardElement.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedCard(card.id);
            showDeleteModal(card);
        });
    }

    // Abrir link
    const linkBtn = cardElement.querySelector('[data-action="open-link"]');
    if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedCard(card.id);
            showLinkModal(card);
        });
    }

    // Clique no card
    cardElement.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions')) return;
        if (e.target.closest('.card-link')) return;

        setSelectedCard(card.id);
        // Se tem link, mostra modal de confirmação
        if (card.link) {
            showLinkModal(card);
        } else {
            // Se não tem link, abre para edição
            openEditCardModal(card);
        }
    });

    // Menu de contexto
    cardElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, card);
    });
}

/**
 * Mostra modal para abrir link/deep link
 * @param {Object} card - Card com link
 */
function showLinkModal(card) {
    setSelectedCard(card.id);
    setModalVisibility('linkModal', true);

    // O modal em si será manipulado por modals.js
    // Aqui apenas configuramos o card selecionado
}

/**
 * Mostra modal de confirmação para exclusão
 * @param {Object} card - Card a ser excluído
 */
function showDeleteModal(card) {
    setSelectedCard(card.id);
    setModalVisibility('deleteModal', true);
}

/**
 * Abre modal para editar um card
 * @param {Object} card - Card a ser editado
 */
function openEditCardModal(card) {
    setSelectedCard(card.id);
    setModalVisibility('cardModal', true);

    // O preenchimento do formulário será feito por modals.js
}

/**
 * Cria um novo card (abre modal de criação)
 * @param {string} defaultTab - Tab padrão para o novo card
 */
export function createNewCard(defaultTab = null) {
    const state = getState();
    const tab = defaultTab || state.activeTab;

    setSelectedCard(null);
    setModalVisibility('cardModal', true);

    // O modal será configurado por modals.js
}

/**
 * Atualiza um card existente
 * @param {string} cardId - ID do card
 * @param {Object} cardData - Novos dados do card
 * @returns {boolean} Sucesso da operação
 */
export async function updateExistingCard(cardId, cardData) {
    const updatedCard = updateCard(cardId, cardData);

    if (updatedCard) {
        // Atualiza estado
        const state = getState();
        const updatedCards = state.cards.map(card =>
            card.id === cardId ? updatedCard : card
        );
        updateCards(updatedCards);

        // Re-renderiza
        renderCards();
        return true;
    }

    return false;
}

/**
 * Remove um card
 * @param {string} cardId - ID do card a remover
 * @returns {boolean} Sucesso da operação
 */
export async function removeCard(cardId) {
    const success = deleteCard(cardId);

    if (success) {
        // Atualiza estado
        const state = getState();
        const updatedCards = state.cards.filter(card => card.id !== cardId);
        updateCards(updatedCards);

        // Re-renderiza
        renderCards();
        return true;
    }

    return false;
}

/**
 * Atualiza os badges de contagem em cada aba
 */
function updateBadgeCounts() {
    const tabs = ['rotina', 'economia', 'lembretes', 'links'];

    tabs.forEach(tab => {
        const badgeElement = document.getElementById(`${tab}Count`);
        if (badgeElement) {
            const cards = getCardsByTab(tab);
            badgeElement.textContent = cards.length;
        }
    });

    // Atualiza contadores na sidebar (desktop)
    const todayCountElement = document.getElementById('todayCount');
    const pendingCountElement = document.getElementById('pendingCount');

    if (todayCountElement || pendingCountElement) {
        const state = getState();
        if (todayCountElement) {
            todayCountElement.textContent = state.stats.today;
        }
        if (pendingCountElement) {
            pendingCountElement.textContent = state.stats.pending;
        }
    }
}

/**
 * Atualiza os empty states (mensagens quando não há cards)
 */
function updateEmptyStates() {
    const tabs = ['rotina', 'economia', 'lembretes', 'links'];

    tabs.forEach(tab => {
        const emptyStateElement = document.getElementById(`${tab}EmptyState`);
        const cardsContainer = document.getElementById(`${tab}Cards`);

        if (emptyStateElement && cardsContainer) {
            const hasCards = cardsContainer.children.length > 0;

            if (hasCards) {
                emptyStateElement.style.display = 'none';
                cardsContainer.style.display = 'grid';
            } else {
                emptyStateElement.style.display = 'flex';
                cardsContainer.style.display = 'none';
            }
        }
    });
}

/**
 * Inicializa funcionalidade de drag and drop para reordenar cards
 */
function initDragAndDrop() {
    const cards = document.querySelectorAll('.card[draggable="true"]');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
    });
}

/**
 * Handler para início do drag
 * @param {DragEvent} e - Evento de drag
 */
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
    e.target.classList.add('dragging');

    // Adiciona efeito visual
    setTimeout(() => {
        e.target.style.opacity = '0.4';
    }, 0);
}

/**
 * Handler para fim do drag
 * @param {DragEvent} e - Evento de drag
 */
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '';

    // Remove indicadores de drop
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });
}

/**
 * Handler para drag over
 * @param {DragEvent} e - Evento de drag
 */
function handleDragOver(e) {
    e.preventDefault();

    const draggingCard = document.querySelector('.dragging');
    const container = e.currentTarget.closest('.cards-container');

    if (!container || !draggingCard) return;

    const afterElement = getDragAfterElement(container, e.clientY);
    const dropIndicator = container.querySelector('.drop-indicator');

    if (dropIndicator) {
        if (afterElement) {
            container.insertBefore(dropIndicator, afterElement);
        } else {
            container.appendChild(dropIndicator);
        }
    }
}

/**
 * Handler para drag enter
 * @param {DragEvent} e - Evento de drag
 */
function handleDragEnter(e) {
    e.preventDefault();

    const container = e.currentTarget.closest('.cards-container');
    if (!container) return;

    // Adiciona indicador de drop
    let dropIndicator = container.querySelector('.drop-indicator');
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
        container.appendChild(dropIndicator);
    }

    dropIndicator.classList.add('active');
}

/**
 * Handler para drag leave
 * @param {DragEvent} e - Evento de drag
 */
function handleDragLeave(e) {
    // Só remove o indicador se saiu do container
    if (!e.currentTarget.contains(e.relatedTarget)) {
        const container = e.currentTarget.closest('.cards-container');
        const dropIndicator = container?.querySelector('.drop-indicator');
        if (dropIndicator) {
            dropIndicator.classList.remove('active');
        }
    }
}

/**
 * Handler para drop
 * @param {DragEvent} e - Evento de drag
 */
function handleDrop(e) {
    e.preventDefault();

    const cardId = e.dataTransfer.getData('text/plain');
    const draggedCard = document.getElementById(`card-${cardId}`);
    const container = e.currentTarget.closest('.cards-container');

    if (!draggedCard || !container) return;

    const afterElement = getDragAfterElement(container, e.clientY);
    const dropIndicator = container.querySelector('.drop-indicator');

    if (afterElement) {
        container.insertBefore(draggedCard, afterElement);
    } else {
        container.appendChild(draggedCard);
    }

    // Remove indicador
    if (dropIndicator) {
        dropIndicator.remove();
    }

    // Atualiza ordem no storage
    const cardIds = Array.from(container.children)
        .filter(child => child.classList.contains('card'))
        .map(card => card.dataset.cardId);

    reorderCardsInStorage(cardIds);

    // Atualiza estado
    const state = getState();
    reorderCardsInState(cardIds);
}

/**
 * Reordena cards no estado
 * @param {string[]} cardIds - IDs na nova ordem
 */
function reorderCardsInState(cardIds) {
    const state = getState();
    const tab = state.activeTab;
    const tabCards = getCardsByTab(tab);

    // Reordena apenas os cards da aba atual
    const orderedCards = cardIds.map(id =>
        tabCards.find(card => card.id === id)
    ).filter(Boolean);

    // Mantém outros cards
    const otherCards = state.cards.filter(card => card.tab !== tab);
    const allCards = [...orderedCards, ...otherCards];

    updateCards(allCards);
}

/**
 * Calcula a posição após o elemento durante drag and drop
 * @param {HTMLElement} container - Container de cards
 * @param {number} y - Posição Y do mouse
 * @returns {HTMLElement|null} Elemento após a posição
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Retorna informação formatada sobre a data do card
 * @param {Object} card - Card com data
 * @returns {string} Informação da data
 */
function getDateInfo(card) {
    if (!card.date) return 'Sem data';

    if (isToday(card.date)) {
        return 'Hoje';
    }

    const days = daysUntil(card.date);
    return getDaysDescription(days);
}

/**
 * Extrai o domínio de uma URL para exibição
 * @param {string} url - URL completa
 * @returns {string} Domínio da URL
 */
function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        // Para deep links ou URLs inválidas
        if (url.startsWith('app://')) {
            return 'App móvel';
        }
        return 'Link rápido';
    }
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto seguro
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Mostra menu de contexto para cards
 * @param {Event} e - Evento de clique
 * @param {Object} card - Card associado
 */
function showContextMenu(e, card) {
    // Remove menu de contexto existente
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Cria novo menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    menu.innerHTML = `
        <div class="context-menu-item" data-action="edit">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5l4 4m-6-6L4 14l-4 4 4-4 9-9z"/>
            </svg>
            <span>Editar</span>
        </div>
        <div class="context-menu-item" data-action="open-link" ${!card.link ? 'style="display:none"' : ''}>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <span>Abrir link</span>
        </div>
        <div class="context-menu-item delete" data-action="delete">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h14M5 6V4a2 2 0 012-2h6a2 2 0 012 2v2m-3 0v10M9 6v10"/>
            </svg>
            <span>Excluir</span>
        </div>
    `;

    // Adiciona eventos
    menu.addEventListener('click', (menuEvent) => {
        const action = menuEvent.target.closest('.context-menu-item')?.dataset.action;

        if (action === 'edit') {
            setSelectedCard(card.id);
            openEditCardModal(card);
        } else if (action === 'open-link' && card.link) {
            setSelectedCard(card.id);
            showLinkModal(card);
        } else if (action === 'delete') {
            setSelectedCard(card.id);
            showDeleteModal(card);
        }

        menu.remove();
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    }, { once: true });

    document.body.appendChild(menu);
}