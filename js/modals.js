// modals.js - Gerenciamento de modais e interações

import { 
    getState, 
    setSelectedCard, 
    setModalVisibility, 
    updateCards,
    getSelectedCard 
} from './state.js';
import { 
    saveCard, 
    updateCard, 
    deleteCard,
    getAllCards 
} from './storage.js';
import { 
    formatDateForInput, 
    getToday, 
    isValidUrl,
    getAvailableCategories,
    getAvailableStatus,
    getAvailablePriorities 
} from './utils.js';
import { 
    updateExistingCard, 
    removeCard, 
    renderCards 
} from './cards.js';

// Referências aos elementos do DOM
let modalElements = {};
let formElements = {};
let currentLinkToOpen = null;

/**
 * Inicializa todos os modais e listeners
 */
export function initModals() {
    cacheModalElements();
    bindModalEvents();
    bindFormEvents();
    bindGlobalEvents();
}

/**
 * Cache de referências aos elementos dos modais
 */
function cacheModalElements() {
    // Modais
    modalElements = {
        overlay: document.getElementById('overlay'),
        cardModal: document.getElementById('cardModal'),
        linkModal: document.getElementById('linkModal'),
        deleteModal: document.getElementById('deleteModal'),
        modalClose: document.getElementById('modalClose'),
        linkModalClose: document.getElementById('linkModalClose'),
        deleteModalClose: document.getElementById('deleteModalClose'),
        cancelButton: document.getElementById('cancelButton'),
        cancelLinkButton: document.getElementById('cancelLinkButton'),
        cancelDeleteButton: document.getElementById('cancelDeleteButton'),
        confirmLinkButton: document.getElementById('confirmLinkButton'),
        confirmDeleteButton: document.getElementById('confirmDeleteButton'),
        saveButton: document.getElementById('saveButton'),
        cardForm: document.getElementById('cardForm'),
        modalTitle: document.getElementById('modalTitle'),
        linkModalText: document.getElementById('linkModalText'),
        linkModalUrl: document.getElementById('linkModalUrl')
    };
    
    // Elementos do formulário
    formElements = {
        cardId: document.getElementById('cardId'),
        cardTitle: document.getElementById('cardTitle'),
        cardDate: document.getElementById('cardDate'),
        cardCategory: document.getElementById('cardCategory'),
        cardStatus: document.getElementById('cardStatus'),
        cardPriority: document.getElementById('cardPriority'),
        cardLink: document.getElementById('cardLink'),
        cardTab: document.getElementById('cardTab')
    };
}

/**
 * Vincula eventos aos botões dos modais
 */
function bindModalEvents() {
    // Fechar modais
    modalElements.modalClose?.addEventListener('click', () => closeAllModals());
    modalElements.linkModalClose?.addEventListener('click', () => closeAllModals());
    modalElements.deleteModalClose?.addEventListener('click', () => closeAllModals());
    modalElements.cancelButton?.addEventListener('click', () => closeAllModals());
    modalElements.cancelLinkButton?.addEventListener('click', () => closeAllModals());
    modalElements.cancelDeleteButton?.addEventListener('click', () => closeAllModals());
    modalElements.overlay?.addEventListener('click', () => closeAllModals());
    
    // Confirmar ações
    modalElements.confirmLinkButton?.addEventListener('click', confirmLinkOpen);
    modalElements.confirmDeleteButton?.addEventListener('click', confirmDelete);
    
    // Fechar com ESC
    document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Vincula eventos ao formulário de card
 */
function bindFormEvents() {
    modalElements.cardForm?.addEventListener('submit', handleFormSubmit);
    
    // Validação em tempo real
    formElements.cardTitle?.addEventListener('input', validateForm);
    formElements.cardLink?.addEventListener('input', validateForm);
}

/**
 * Vincula eventos globais
 */
function bindGlobalEvents() {
    // Focus trapping para acessibilidade
    document.addEventListener('focus', trapFocus, true);
}

/**
 * Handler para tecla ESC - fecha modais
 * @param {KeyboardEvent} e - Evento de teclado
 */
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
}

/**
 * Trava o foco dentro do modal para acessibilidade
 * @param {FocusEvent} e - Evento de focus
 */
function trapFocus(e) {
    const state = getState();
    const activeModal = getActiveModal();
    
    if (!activeModal || !state.modals[activeModal]) return;
    
    const modalElement = modalElements[activeModal];
    if (!modalElement) return;
    
    const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (!firstFocusable) return;
    
    if (e.target === firstFocusable && e.shiftKey) {
        e.preventDefault();
        lastFocusable.focus();
    } else if (e.target === lastFocusable && !e.shiftKey) {
        e.preventDefault();
        firstFocusable.focus();
    }
}

/**
 * Fecha todos os modais e limpa estado
 */
export function closeAllModals() {
    const state = getState();
    
    // Fecha todos os modais
    Object.keys(state.modals).forEach(modalName => {
        setModalVisibility(modalName, false);
    });
    
    // Esconde overlay
    modalElements.overlay?.classList.remove('active');
    
    // Remove classes dos modais
    Object.values(modalElements).forEach(element => {
        if (element && element.classList) {
            element.classList.remove('active');
        }
    });
    
    // Limpa form
    resetForm();
    
    // Limpa estado
    setSelectedCard(null);
    currentLinkToOpen = null;
    
    // Remove foco do modal
    document.activeElement?.blur();
}

/**
 * Abre o modal de criação/edição de card
 * @param {Object|null} cardData - Dados do card para edição (null para criação)
 * @param {string} defaultTab - Tab padrão para novo card
 */
export function openCardModal(cardData = null, defaultTab = null) {
    closeAllModals();
    
    // Preenche formulário
    if (cardData) {
        // Modo edição
        fillEditForm(cardData);
        modalElements.modalTitle.textContent = 'Editar Card';
    } else {
        // Modo criação
        resetForm();
        modalElements.modalTitle.textContent = 'Criar Novo Card';
        
        // Define valores padrão
        const state = getState();
        formElements.cardTab.value = defaultTab || state.activeTab;
        formElements.cardDate.value = getToday();
        formElements.cardStatus.value = 'pendente';
        formElements.cardPriority.value = 'media';
        formElements.cardCategory.value = '';
    }
    
    // Mostra modal
    setModalVisibility('cardModal', true);
    modalElements.cardModal.classList.add('active');
    modalElements.overlay.classList.add('active');
    
    // Foco no primeiro campo
    setTimeout(() => {
        formElements.cardTitle.focus();
    }, 100);
}

/**
 * Abre modal de confirmação para abrir link/deep link
 * @param {Object} card - Card com link
 */
export function openLinkModal(card) {
    if (!card || !card.link) return;
    
    closeAllModals();
    
    // Configura modal
    const url = card.link;
    const isDeepLink = url.startsWith('app://') || url.startsWith('intent://');
    const displayUrl = isDeepLink ? 'Aplicativo móvel' : new URL(url).hostname;
    
    modalElements.linkModalText.textContent = isDeepLink 
        ? 'Deseja abrir o aplicativo vinculado agora?'
        : 'Deseja abrir o link externo agora?';
    
    modalElements.linkModalUrl.textContent = displayUrl;
    currentLinkToOpen = url;
    
    // Mostra modal
    setModalVisibility('linkModal', true);
    modalElements.linkModal.classList.add('active');
    modalElements.overlay.classList.add('active');
    
    // Foco no botão cancelar por padrão (mais seguro)
    setTimeout(() => {
        modalElements.cancelLinkButton.focus();
    }, 100);
}

/**
 * Abre modal de confirmação para exclusão
 * @param {Object} card - Card a ser excluído
 */
export function openDeleteModal(card) {
    if (!card) return;
    
    closeAllModals();
    
    setModalVisibility('deleteModal', true);
    modalElements.deleteModal.classList.add('active');
    modalElements.overlay.classList.add('active');
    
    // Foco no botão cancelar por padrão
    setTimeout(() => {
        modalElements.cancelDeleteButton.focus();
    }, 100);
}

/**
 * Preenche formulário com dados do card para edição
 * @param {Object} card - Dados do card
 */
function fillEditForm(card) {
    formElements.cardId.value = card.id;
    formElements.cardTitle.value = card.title || '';
    formElements.cardDate.value = card.date ? formatDateForInput(card.date) : '';
    formElements.cardCategory.value = card.category || '';
    formElements.cardStatus.value = card.status || 'pendente';
    formElements.cardPriority.value = card.priority || 'media';
    formElements.cardLink.value = card.link || '';
    formElements.cardTab.value = card.tab || 'rotina';
    
    // Valida form após preenchimento
    validateForm();
}

/**
 * Reseta o formulário para estado inicial
 */
function resetForm() {
    formElements.cardId.value = '';
    formElements.cardTitle.value = '';
    formElements.cardDate.value = '';
    formElements.cardCategory.value = '';
    formElements.cardStatus.value = 'pendente';
    formElements.cardPriority.value = 'media';
    formElements.cardLink.value = '';
    
    const state = getState();
    formElements.cardTab.value = state.activeTab;
    
    // Remove mensagens de erro
    clearValidationErrors();
}

/**
 * Handler para submit do formulário
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showToast('Por favor, corrija os erros no formulário', 'error');
        return;
    }
    
    const cardId = formElements.cardId.value;
    const isEditing = !!cardId;
    
    const cardData = {
        title: formElements.cardTitle.value.trim(),
        date: formElements.cardDate.value || null,
        category: formElements.cardCategory.value,
        status: formElements.cardStatus.value,
        priority: formElements.cardPriority.value,
        link: formElements.cardLink.value.trim() || null,
        tab: formElements.cardTab.value
    };
    
    try {
        let result;
        
        if (isEditing) {
            // Atualização
            result = await updateExistingCard(cardId, cardData);
            if (result) {
                showToast('Card atualizado com sucesso!', 'success');
            }
        } else {
            // Criação
            const newCard = saveCard(cardData);
            if (newCard) {
                // Atualiza estado
                const state = getState();
                const updatedCards = [...state.cards, newCard];
                updateCards(updatedCards);
                
                // Re-renderiza
                renderCards();
                
                showToast('Card criado com sucesso!', 'success');
            }
        }
        
        if (result !== false) {
            closeAllModals();
        }
        
    } catch (error) {
        console.error('Erro ao salvar card:', error);
        showToast('Erro ao salvar card. Tente novamente.', 'error');
    }
}

/**
 * Valida o formulário de card
 * @returns {boolean} True se válido
 */
function validateForm() {
    let isValid = true;
    const title = formElements.cardTitle.value.trim();
    const link = formElements.cardLink.value.trim();
    
    // Limpa erros anteriores
    clearValidationErrors();
    
    // Valida título
    if (!title) {
        markFieldInvalid(formElements.cardTitle, 'Título é obrigatório');
        isValid = false;
    } else if (title.length > 100) {
        markFieldInvalid(formElements.cardTitle, 'Título muito longo (máx. 100 caracteres)');
        isValid = false;
    }
    
    // Valida link (se preenchido)
    if (link && !isValidUrl(link)) {
        markFieldInvalid(formElements.cardLink, 'URL inválida');
        isValid = false;
    }
    
    // Valida data (se preenchida)
    if (formElements.cardDate.value) {
        const date = new Date(formElements.cardDate.value);
        if (isNaN(date.getTime())) {
            markFieldInvalid(formElements.cardDate, 'Data inválida');
            isValid = false;
        }
    }
    
    // Atualiza estado do botão salvar
    modalElements.saveButton.disabled = !isValid;
    
    return isValid;
}

/**
 * Marca um campo como inválido
 * @param {HTMLElement} field - Campo do formulário
 * @param {string} message - Mensagem de erro
 */
function markFieldInvalid(field, message) {
    field.classList.add('invalid');
    
    // Adiciona mensagem de erro
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = 'var(--color-error)';
        errorElement.style.fontSize = 'var(--font-size-xs)';
        errorElement.style.marginTop = 'var(--space-1)';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

/**
 * Limpa todas as mensagens de erro do formulário
 */
function clearValidationErrors() {
    // Remove classes invalid
    Object.values(formElements).forEach(field => {
        if (field) {
            field.classList.remove('invalid');
            
            // Remove mensagens de erro
            const errorElement = field.parentNode?.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    });
    
    // Habilita botão salvar
    modalElements.saveButton.disabled = false;
}

/**
 * Confirma a abertura do link/deep link
 */
function confirmLinkOpen() {
    if (!currentLinkToOpen) {
        closeAllModals();
        return;
    }
    
    try {
        // Tenta abrir o link
        window.location.href = currentLinkToOpen;
        
        // Fecha modal após um pequeno delay
        setTimeout(() => {
            closeAllModals();
        }, 100);
        
    } catch (error) {
        console.error('Erro ao abrir link:', error);
        showToast('Não foi possível abrir o link. Verifique se o aplicativo está instalado.', 'error');
        closeAllModals();
    }
}

/**
 * Confirma a exclusão do card
 */
async function confirmDelete() {
    const state = getState();
    const cardId = state.selectedCardId;
    
    if (!cardId) {
        closeAllModals();
        return;
    }
    
    try {
        const success = await removeCard(cardId);
        
        if (success) {
            showToast('Card excluído com sucesso!', 'success');
        } else {
            showToast('Erro ao excluir card. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao excluir card:', error);
        showToast('Erro ao excluir card. Tente novamente.', 'error');
    }
    
    closeAllModals();
}

/**
 * Retorna o nome do modal ativo
 * @returns {string|null} Nome do modal ativo
 */
function getActiveModal() {
    const state = getState();
    
    for (const [modalName, isVisible] of Object.entries(state.modals)) {
        if (isVisible) {
            return modalName;
        }
    }
    
    return null;
}

/**
 * Mostra uma mensagem toast temporária
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo ('success', 'error', 'warning')
 */
function showToast(message, type = 'info') {
    // Remove toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Cria novo toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Estilização adicional
    toast.style.cssText = `
        position: fixed;
        bottom: calc(var(--bottom-nav-height) + var(--space-4));
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: var(--color-${type});
        color: var(--color-text-on-primary);
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-index-toast);
        opacity: 0;
        transition: all var(--transition-normal);
        max-width: 90%;
        text-align: center;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
    `;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Atualiza modais baseado no estado
 * (Chamado quando o estado muda)
 */
export function updateModalsFromState() {
    const state = getState();
    
    // Atualiza visibilidade dos modais
    Object.entries(state.modals).forEach(([modalName, isVisible]) => {
        const modalElement = modalElements[modalName];
        if (modalElement) {
            if (isVisible) {
                modalElement.classList.add('active');
                modalElements.overlay.classList.add('active');
            } else {
                modalElement.classList.remove('active');
                
                // Esconde overlay apenas se todos os modais estiverem fechados
                const anyModalVisible = Object.values(state.modals).some(visible => visible);
                if (!anyModalVisible) {
                    modalElements.overlay.classList.remove('active');
                }
            }
        }
    });
    
    // Se cardModal está aberto, garante que o formulário está sincronizado
    if (state.modals.cardModal) {
        const selectedCard = getSelectedCard();
        if (selectedCard && !formElements.cardId.value) {
            // Preenche formulário se há card selecionado mas formulário vazio
            fillEditForm(selectedCard);
        } else if (!selectedCard && formElements.cardId.value) {
            // Limpa formulário se não há card selecionado mas formulário preenchido
            resetForm();
        }
    }
}