// app.js - Ponto de entrada da aplicação (VERSÃO REFATORADA)
// Responsabilidade única: bootstrap e inicialização

import { loadInitialState, subscribe } from './state.js';
import { renderCards } from './cards.js';
import { initModals, updateModalsFromState } from './modals.js';
import { initNavigation, updateNavigationFromState, updateCurrentDate } from './navigation.js';

/**
 * Inicializa a aplicação quando o DOM está pronto
 */
async function initApp() {
    try {
        // Atualiza data atual
        updateCurrentDate();

        // Carrega estado inicial (cards do LocalStorage)
        await loadInitialState();

        // Inicializa módulos de interface
        initNavigation();
        initModals();

        // Renderiza cards iniciais
        renderCards();

        // Configura listener único para mudanças de estado
        setupStateListener();

        // Configura Service Worker
        setupServiceWorker();

        console.log('Aplicação inicializada com sucesso!');

    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showErrorState();
    }
}

/**
 * Configura listener único para mudanças de estado
 */
function setupStateListener() {
    // Atualiza interface quando o estado muda
    subscribe((state) => {
        // Atualiza modais
        updateModalsFromState();
        
        // Atualiza navegação
        updateNavigationFromState();
        
        // Atualiza contadores
        updateCardCounters(state);
    });
}

/**
 * Configura Service Worker para PWA
 */
function setupServiceWorker() {
    // Apenas registra se estiver em HTTPS/localhost (não file://)
    if ('serviceWorker' in navigator && 
        (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
        
        window.addEventListener('load', () => {
            const swPath = './service-worker.js';
            
            navigator.serviceWorker.register(swPath)
                .then(registration => {
                    console.log('Service Worker registrado com sucesso:', registration.scope);
                    
                    // Verifica atualizações
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('Nova versão do Service Worker encontrada:', newWorker);
                    });
                })
                .catch(error => {
                    console.log('Falha ao registrar Service Worker:', error);
                });
        });
    }
}

/**
 * Atualiza contadores de cards na interface
 */
function updateCardCounters(state) {
    const todayCountElement = document.getElementById('todayCount');
    const pendingCountElement = document.getElementById('pendingCount');

    if (todayCountElement) {
        const todayCards = state.cards.filter(card => {
            if (!card.date) return false;
            const cardDate = new Date(card.date).toDateString();
            const today = new Date().toDateString();
            return cardDate === today;
        }).length;
        todayCountElement.textContent = todayCards;
    }

    if (pendingCountElement) {
        const pendingCards = state.cards.filter(card => card.status === 'pendente').length;
        pendingCountElement.textContent = pendingCards;
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
 * Configura atualização automática da data
 */
function setupDateUpdate() {
    // Atualiza data a cada minuto
    setInterval(updateCurrentDate, 60000);

    // Configura atualização à meia-noite
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeToMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
        updateCurrentDate();
        setInterval(updateCurrentDate, 86400000); // Atualiza a cada 24h
    }, timeToMidnight);
}

// Inicializa a aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Configura atualização de data
setupDateUpdate();