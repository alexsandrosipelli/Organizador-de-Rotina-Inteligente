// navigation.js - Navegação entre abas e menus

import { getState, setActiveTab, setModalVisibility, setSearchVisibility } from './state.js';
import { renderCards } from './cards.js';

/**
 * Inicializa toda a navegação da aplicação
 */
export function initNavigation() {
    initTabNavigation();
    initMenuToggle();
    initSearchToggle();
    initCreateButtons();
    initResponsiveBehavior();
    updateNavigationFromState();
}

/**
 * Inicializa navegação por abas (bottom nav e sidebar)
 */
function initTabNavigation() {
    // Bottom navigation (mobile)
    const bottomNavItems = document.querySelectorAll('.bottom-navigation .nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Sidebar navigation (desktop)
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Botão de criar no sidebar (desktop)
    const sidebarCreateBtn = document.getElementById('sidebarCreateButton');
    if (sidebarCreateBtn) {
        sidebarCreateBtn.addEventListener('click', () => {
            setModalVisibility('cardModal', true);
        });
    }
}

/**
 * Inicializa o botão de menu hamburger (mobile)
 */
function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');

        if (!sidebar || !menuToggle) return;

        const isClickInsideMenu = sidebar.contains(e.target);
        const isClickOnToggle = menuToggle.contains(e.target);

        if (!isClickInsideMenu && !isClickOnToggle && sidebar.classList.contains('mobile-open')) {
            closeMobileMenu();
        }
    });
}

/**
 * Inicializa o botão de busca
 */
function initSearchToggle() {
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', toggleSearch);
    }

    // Fecha busca com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
        }
    });
}

/**
 * Inicializa todos os botões de criação
 */
function initCreateButtons() {
    // Botão central na bottom navigation
    const createButton = document.getElementById('createButton');
    if (createButton) {
        createButton.addEventListener('click', () => {
            const state = getState();
            setModalVisibility('cardModal', true);
        });
    }

    // Botão "Criar primeira tarefa"
    const addFirstTask = document.getElementById('addFirstTask');
    if (addFirstTask) {
        addFirstTask.addEventListener('click', () => {
            const state = getState();
            setModalVisibility('cardModal', true);
        });
    }
}

/**
 * Inicializa comportamentos responsivos
 */
function initResponsiveBehavior() {
    // Atualiza navegação quando a janela é redimensionada
    window.addEventListener('resize', handleResize);

    // Fecha menu mobile ao mudar para desktop
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            // Modo desktop - fecha menu mobile se estiver aberto
            closeMobileMenu();
        }
    });
}

/**
 * Alterna entre abas
 * @param {string} tabName - Nome da aba ('rotina', 'economia', 'lembretes', 'links')
 */
function switchTab(tabName) {
    const validTabs = ['rotina', 'economia', 'lembretes', 'links'];

    if (!validTabs.includes(tabName)) {
        console.warn(`Tentativa de alternar para aba inválida: ${tabName}`);
        return;
    }

    // Atualiza estado
    setActiveTab(tabName);

    // Atualiza navegação visual
    updateNavigationVisual(tabName);

    // Fecha menu mobile se estiver aberto
    closeMobileMenu();

    // Fecha busca se estiver aberta
    closeSearch();

    // Renderiza os cards da nova aba
    renderCards();

    // Atualiza conteúdo da aba
    updateTabContent(tabName);

    // Scroll para o topo
    scrollToTop();
}

/**
 * Atualiza a navegação visual com a aba ativa
 * @param {string} activeTab - Nome da aba ativa
 */
function updateNavigationVisual(activeTab) {
    // Atualiza bottom navigation (mobile)
    const bottomNavItems = document.querySelectorAll('.bottom-navigation .nav-item');
    bottomNavItems.forEach(item => {
        if (item.dataset.tab === activeTab) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Atualiza sidebar (desktop)
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.dataset.tab === activeTab) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Atualiza conteúdo das abas
    updateTabContent(activeTab);
}

/**
 * Atualiza o conteúdo visível das abas
 * @param {string} activeTab - Nome da aba ativa
 */
function updateTabContent(activeTab) {
    // Esconde todas as abas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // Mostra apenas a aba ativa
    const activeTabContent = document.getElementById(`${activeTab}Tab`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }
}

/**
 * Alterna o menu mobile (abre/fecha)
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (!sidebar || !menuToggle) return;

    if (sidebar.classList.contains('mobile-open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Abre o menu mobile
 */
function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('overlay');

    if (!sidebar || !menuToggle) return;

    // Abre menu
    sidebar.classList.add('mobile-open');
    menuToggle.classList.add('active');

    // Mostra overlay
    if (overlay) {
        overlay.classList.add('active');
        overlay.style.zIndex = 'var(--z-index-modal-backdrop)';
        overlay.addEventListener('click', closeMobileMenu);
    }

    // Previne scroll no body
    document.body.style.overflow = 'hidden';

    // Anima ícone do hamburger
    const menuIcons = menuToggle.querySelectorAll('.menu-icon');
    if (menuIcons.length === 3) {
        menuIcons[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        menuIcons[1].style.opacity = '0';
        menuIcons[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    }
}

/**
 * Fecha o menu mobile
 */
function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('overlay');

    if (!sidebar || !menuToggle) return;

    // Fecha menu
    sidebar.classList.remove('mobile-open');
    menuToggle.classList.remove('active');

    // Esconde overlay
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.zIndex = '';
        overlay.removeEventListener('click', closeMobileMenu);
    }

    // Restaura scroll do body
    document.body.style.overflow = '';

    // Restaura ícone do hamburger
    const menuIcons = menuToggle.querySelectorAll('.menu-icon');
    if (menuIcons.length === 3) {
        menuIcons[0].style.transform = '';
        menuIcons[1].style.opacity = '';
        menuIcons[2].style.transform = '';
    }
}

/**
 * Alterna a visibilidade da busca
 */
function toggleSearch() {
    const state = getState();

    if (state.isSearchVisible) {
        closeSearch();
    } else {
        openSearch();
    }
}

/**
 * Abre a barra de busca
 */
function openSearch() {
    setSearchVisibility(true);

    // Foca no input de busca
    setTimeout(() => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);

    // Fecha menu mobile se estiver aberto
    closeMobileMenu();
}

/**
 * Fecha a barra de busca
 */
function closeSearch() {
    setSearchVisibility(false);
}

/**
 * Atualiza a navegação baseado no estado atual
 */
export function updateNavigationFromState() {
    const state = getState();

    // Atualiza navegação visual
    updateNavigationVisual(state.activeTab);

    // Atualiza conteúdo da aba
    updateTabContent(state.activeTab);

    // Atualiza visibilidade da busca
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        if (state.isSearchVisible) {
            searchContainer.classList.add('active');
        } else {
            searchContainer.classList.remove('active');
        }
    }
}

/**
 * Handler para redimensionamento da janela
 */
function handleResize() {
    const isDesktop = window.innerWidth >= 768;

    // Ajustes específicos para mobile/desktop
    if (isDesktop) {
        // Desktop - garante que menu mobile está fechado
        closeMobileMenu();
    } else {
        // Mobile - garante que sidebar está oculta por padrão
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }

    // Atualiza navegação
    updateNavigationFromState();
}

/**
 * Scroll suave para o topo da página
 */
function scrollToTop() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

/**
 * Adiciona suporte a swipe entre abas (mobile)
 */
export function initSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    mainContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        // Ignora swipes muito pequenos
        if (Math.abs(swipeDistance) < swipeThreshold) return;

        const state = getState();
        const tabs = ['rotina', 'economia', 'lembretes', 'links'];
        const currentIndex = tabs.indexOf(state.activeTab);

        if (swipeDistance > 0) {
            // Swipe para direita - aba anterior
            if (currentIndex > 0) {
                switchTab(tabs[currentIndex - 1]);
            }
        } else {
            // Swipe para esquerda - próxima aba
            if (currentIndex < tabs.length - 1) {
                switchTab(tabs[currentIndex + 1]);
            }
        }
    }
}

/**
 * Atualiza a data atual no header e sidebar
 */
export function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    const formattedDate = now.toLocaleDateString('pt-BR', options);

    // Atualiza no header (mobile)
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formattedDate;
    }

    // Atualiza no sidebar (desktop)
    const sidebarDateElement = document.getElementById('sidebarDate');
    if (sidebarDateElement) {
        sidebarDateElement.textContent = formattedDate;
    }
}

/**
 * Retorna a aba atual
 * @returns {string} Nome da aba ativa
 */
export function getCurrentTab() {
    return getState().activeTab;
}

/**
 * Navega para a próxima aba (para navegação por teclado)
 */
export function nextTab() {
    const tabs = ['rotina', 'economia', 'lembretes', 'links'];
    const currentIndex = tabs.indexOf(getCurrentTab());
    const nextIndex = (currentIndex + 1) % tabs.length;

    switchTab(tabs[nextIndex]);
}

/**
 * Navega para a aba anterior (para navegação por teclado)
 */
export function previousTab() {
    const tabs = ['rotina', 'economia', 'lembretes', 'links'];
    const currentIndex = tabs.indexOf(getCurrentTab());
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;

    switchTab(tabs[prevIndex]);
}