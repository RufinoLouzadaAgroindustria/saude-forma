import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="padding:20px;color:#b91c1c;font-family:sans-serif"><h3>Erro no Aplicativo:</h3><pre>${e.message}</pre></div>`;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
