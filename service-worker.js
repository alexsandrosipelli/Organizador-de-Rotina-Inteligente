/* service-worker.js
   Service Worker básico para o Organizador de Rotina Inteligente
   Compatível com GitHub Pages
*/

const CACHE_NAME = 'organizador-rotina-v1';

// Arquivos essenciais para funcionar offline
const FILES_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './css/components.css',
    './css/mobile.css',
    './js/app.js',
    './js/utils.js',
    './js/state.js',
    './js/cards.js',
    './js/modals.js',
    './js/navigation.js',
    './js/storage.js',
    './assets/icons/favicon.svg'
];

/* ================================
   INSTALAÇÃO
================================ */
self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando arquivos essenciais');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

/* ================================
   ATIVAÇÃO
================================ */
self.addEventListener('activate', event => {
    console.log('[SW] Ativando Service Worker');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/* ================================
   FETCH (CACHE FIRST)
================================ */
self.addEventListener('fetch', event => {
    // Ignora requisições não-HTTP
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }

            return fetch(event.request)
                .then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                })
                .catch(() => {
                    // Fallback simples se ficar offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
