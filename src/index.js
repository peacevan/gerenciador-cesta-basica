import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot API
import App from './App';
import './index.css'; // Ou qualquer outro estilo global

// Substitua ReactDOM.render por ReactDOM.createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

if (module.hot) {
    module.hot.accept();
}

// Register service worker for PWA (if supported)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
                console.log('Attempting to register service worker /sw.js');
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                console.log('Service worker registration succeeded:', reg);

                // Listen for updatefound -> installing -> installed (waiting)
                reg.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    console.log('Service worker update found, state:', installing && installing.state);
                    installing && installing.addEventListener('statechange', () => {
                        console.log('Installing worker state changed to', installing.state);
                        if (installing.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available; ask it to skip waiting
                                console.log('New service worker installed and waiting; sending SKIP_WAITING');
                                installing.postMessage({ type: 'SKIP_WAITING' });
                            } else {
                                console.log('Service worker installed for first time.');
                            }
                        }
                    });
                });

                // When the new service worker activates, reload to serve the fresh content
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Service worker controller changed — reloading page');
                    window.location.reload();
                });

                navigator.serviceWorker.ready.then((r) => console.log('Service worker ready:', r));
        } catch (err) {
            console.error('Service worker registration failed:', err);
        }
    });
}