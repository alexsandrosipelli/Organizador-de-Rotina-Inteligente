// app.js - Ponto de entrada da aplicação

import { loadInitialState, subscribe, getState } from './state.js';
import { renderCards } from './cards.js';
import { initModals, updateModalsFromState, closeAllModals } from './modals.js';
import { initNavigation, updateNavigationFromState, updateCurrentDate } from './navigation.js';
import { getAvailableCategories, getAvailableStatus, getAvailablePriorities } from './utils.js';

/**
 * Inicializa a aplicação quando o DOM está pronto
 */
async function initApp() {
    try {
        // Mostra estado de carregamento
        showLoadingState();
        
        // Atualiza data atual
        updateCurrentDate();
        
        // Inicializa navegação
        initNavigation();
        
        // Inicializa modais
        initModals();
        
        // Carrega estado inicial (cards do LocalStorage)
        await loadInitialState();
        
        // Renderiza cards iniciais
        renderCards();
        
        // Atualiza navegação baseada no estado
        updateNavigationFromState();
        
        // Configura listeners para mudanças de estado
        setupStateListeners();
        
        // Configura listeners globais
        setupGlobalListeners();
        
        // Esconde loading
        hideLoadingState();
        
        // Configura Service Worker para PWA (se suportado)
        setupServiceWorker();
        
        // Configura atualização automática da data
        setupDateUpdate();
        
        console.log('Aplicação inicializada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showErrorState();
    }
}

/**
 * Mostra estado de carregamento
 */
function showLoadingState() {
    // Adiciona skeleton loading se necessário
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Carregando sua rotina...</p>
            </div>
        `;
        
        // Adiciona estilos inline para o spinner
        const style = document.createElement('style');
        style.textContent = `
            .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 60vh;
                color: var(--color-text-secondary);
            }
            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 3px solid var(--color-gray-200);
                border-top-color: var(--color-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: var(--space-4);
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Esconde estado de carregamento
 */
function hideLoadingState() {
    // Remove qualquer elemento de loading
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.remove();
    }
}

/**
 * Mostra estado de erro
 */
function showErrorState() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <svg width="64" height="64" fill="none" stroke="var(--color-error)" stroke-width="1.5">
                        <path d="M12 9v2m0 4v.01M12 17v.01m9-5.01v.01M15 13v.01M15 17v.01m4.293-7.293l-1.414 1.414M19.828 6.172L18.414 7.586m-12.828.828l1.414-1.414M4.172 6.172L5.586 7.586M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/>
                    </svg>
                </div>
                <h3>Erro ao carregar</h3>
                <p>Não foi possível carregar sua rotina. Tente recarregar a página.</p>
                <button class="btn-primary" onclick="location.reload()">
                    Recarregar página
                </button>
            </div>
        `;
    }
}

/**
 * Configura listeners para mudanças de estado
 */
function setupStateListeners() {
    // Atualiza interface quando o estado muda
    subscribe((state) => {
        // Atualiza modais se necessário
        updateModalsFromState();
        
        // Atualiza navegação se necessário
        updateNavigationFromState();
        
        // Atualiza contadores de cards
        updateCardCounters(state);
    });
}

/**
 * Configura listeners globais
 */
function setupGlobalListeners() {
    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Previne recarregamento acidental
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Atualiza quando a página fica visível novamente
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Detecta mudanças offline/online
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Configura swipe para navegação (mobile)
    setupSwipeNavigation();
}

/**
 * Handler para atalhos de teclado
 * @param {KeyboardEvent} e - Evento de teclado
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N - Novo card
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        closeAllModals();
        setModalVisibility('cardModal', true);
    }
    
    // Ctrl/Cmd + F - Buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchVisibility(!getState().isSearchVisible);
    }
    
    // Esc - Fechar modais/busca
    if (e.key === 'Escape') {
        const state = getState();
        if (state.isSearchVisible) {
            setSearchVisibility(false);
        } else if (Object.values(state.modals).some(modal => modal)) {
            closeAllModals();
        }
    }
    
    // Ctrl/Cmd + S - Salvar (dentro de formulários)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const activeElement = document.activeElement;
        const isInForm = activeElement.closest('form');
        if (isInForm) {
            e.preventDefault();
            const form = activeElement.closest('form');
            if (form) {
                form.requestSubmit();
            }
        }
    }
}

/**
 * Handler para tentativa de fechar a página
 * @param {BeforeUnloadEvent} e - Evento beforeunload
 */
function handleBeforeUnload(e) {
    const state = getState();
    const hasUnsavedChanges = false; // Poderia verificar se há formulários não salvos
    
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
    }
}

/**
 * Handler para mudança de visibilidade da página
 */
function handleVisibilityChange() {
    if (!document.hidden) {
        // Página ficou visível novamente - atualiza data
        updateCurrentDate();
        
        // Atualiza cards (em caso de mudanças em outras abas)
        const state = getState();
        renderCards();
    }
}

/**
 * Handler para mudança de status online/offline
 */
function handleOnlineStatus() {
    const isOnline = navigator.onLine;
    showNetworkStatus(isOnline);
}

/**
 * Mostra status da rede
 * @param {boolean} isOnline - Se está online
 */
function showNetworkStatus(isOnline) {
    // Remove notificação existente
    const existingNotification = document.querySelector('.network-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    if (isOnline) return;
    
    // Cria notificação offline
    const notification = document.createElement('div');
    notification.className = 'network-notification offline';
    notification.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Você está offline. Alguns recursos podem não estar disponíveis.</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: var(--header-height-mobile);
        left: 0;
        right: 0;
        background-color: var(--color-warning);
        color: var(--color-text-primary);
        padding: var(--space-3) var(--space-4);
        text-align: center;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        z-index: var(--z-index-dropdown);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove após alguns segundos (se ficar online)
    if (!isOnline) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

/**
 * Configura navegação por swipe (mobile)
 */
function setupSwipeNavigation() {
    // Implementação básica de swipe
    let touchStartX = 0;
    let touchEndX = 0;
    
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    mainContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });
    
    function handleSwipeGesture() {
        const minSwipeDistance = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) < minSwipeDistance) return;
        
        // Importa dinamicamente para evitar dependência cíclica
        import('./navigation.js').then(({ nextTab, previousTab }) => {
            if (swipeDistance > 0) {
                // Swipe direita - aba anterior
                previousTab();
            } else {
                // Swipe esquerda - próxima aba
                nextTab();
            }
        });
    }
}

/**
 * Atualiza contadores de cards na interface
 * @param {Object} state - Estado atual
 */
function updateCardCounters(state) {
    // Atualiza contadores na sidebar (desktop)
    const todayCountElement = document.getElementById('todayCount');
    const pendingCountElement = document.getElementById('pendingCount');
    
    if (todayCountElement) {
        todayCountElement.textContent = state.stats.today;
    }
    
    if (pendingCountElement) {
        pendingCountElement.textContent = state.stats.pending;
    }
}

/**
 * Configura Service Worker para PWA
 */
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registrado com sucesso:', registration.scope);
                })
                .catch(error => {
                    console.log('Falha ao registrar ServiceWorker:', error);
                });
        });
    }
}

/**
 * Configura atualização automática da data
 */
function setupDateUpdate() {
    // Atualiza data a cada minuto (para garantir precisão)
    setInterval(updateCurrentDate, 60000);
    
    // Também atualiza à meia-noite
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Amanhã
        0, 0, 0 // Meia-noite
    );
    const timeToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
        updateCurrentDate();
        // Configura para meia-noite todos os dias
        setInterval(updateCurrentDate, 86400000);
    }, timeToMidnight);
}

/**
 * Configura fallbacks para funcionalidades não suportadas
 */
function setupFallbacks() {
    // Fallback para LocalStorage
    if (typeof localStorage === 'undefined') {
        console.warn('LocalStorage não suportado. Usando fallback em memória.');
        showToast('Seus dados serão salvos apenas nesta sessão.', 'warning');
    }
    
    // Fallback para date input em navegadores antigos
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    if (dateInput.type !== 'date') {
        console.warn('Input type="date" não suportado. Usando fallback.');
        // Poderia carregar um polyfill aqui
    }
}

/**
 * Função de inicialização principal
 * Executada quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', initApp);

// Exporta funções principais para uso no console (debug)
window.App = {
    initApp,
    getState,
    renderCards,
    closeAllModals,
    updateCurrentDate
};

// Configura fallbacks
setupFallbacks();