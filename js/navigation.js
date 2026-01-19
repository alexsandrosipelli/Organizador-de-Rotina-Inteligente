// navigation.js - Navegação entre abas e menus (VERSÃO FINAL SIMPLIFICADA)
// SEM IMPORT DUPLICADAS - APENAS O ESSENCIAL

import { getState, setActiveTab } from './state.js';
import { renderCards } from './cards.js';

// Exporta funções públicas
export function initNavigation() {
    initTabNavigation();
    initMenuToggle();
    initSearchToggle();
    initCreateButtons();
    initResponsiveBehavior();
    updateNavigationFromState();
}

export function updateNavigationFromState() {
    const state = getState();
    updateNavigationVisual(state.activeTab);
    updateTabContent(state.activeTab);
}

export function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    const formattedDate = now.toLocaleDateString('pt-BR', options);

    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formattedDate;
    }

    const sidebarDateElement = document.getElementById('sidebarDate');
    if (sidebarDateElement) {
        sidebarDateElement.textContent = formattedDate;
    }
}

// Funções internas
function initTabNavigation() {
    document.querySelectorAll('.bottom-navigation .nav-item, .sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
}

function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
}

function initSearchToggle() {
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', toggleSearch);
    }
}

function initCreateButtons() {
    ['createButton', 'sidebarCreateButton', 'addFirstTask'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                // Abre modal sem importações problemáticas
                const cardModal = document.getElementById('cardModal');
                const overlay = document.getElementById('overlay');
                if (cardModal && overlay) {
                    cardModal.classList.add('active');
                    overlay.classList.add('active');
                }
            });
        }
    });
}

function switchTab(tabName) {
    setActiveTab(tabName);
    updateNavigationVisual(tabName);
    updateTabContent(tabName);
    renderCards();
    closeMobileMenu();
    closeSearch();
}

function updateNavigationVisual(activeTab) {
    document.querySelectorAll('[data-tab]').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === activeTab);
    });
}

function updateTabContent(activeTab) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    const activeTabContent = document.getElementById(`${activeTab}Tab`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    if (sidebar.classList.contains('mobile-open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('overlay');

    if (sidebar && menuToggle) {
        sidebar.classList.add('mobile-open');
        menuToggle.classList.add('active');

        if (overlay) {
            overlay.classList.add('active');
            overlay.addEventListener('click', closeMobileMenu);
        }
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('overlay');

    if (sidebar && menuToggle) {
        sidebar.classList.remove('mobile-open');
        menuToggle.classList.remove('active');

        if (overlay) {
            overlay.classList.remove('active');
            overlay.removeEventListener('click', closeMobileMenu);
        }
    }
}

function toggleSearch() {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer) return;

    if (searchContainer.classList.contains('active')) {
        closeSearch();
    } else {
        openSearch();
    }
}

function openSearch() {
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('searchInput');

    if (searchContainer) {
        searchContainer.classList.add('active');

        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }
}

function closeSearch() {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.classList.remove('active');
    }
}

function initResponsiveBehavior() {
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });
}