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