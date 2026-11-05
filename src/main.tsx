import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for debugging white screens
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, 'at', source, ':', lineno, ':', colno, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; color: white; background: #1a1a1a; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <h1 style="color: #ff6b00;">Ops! Algo deu errado.</h1>
        <p>O aplicativo não conseguiu iniciar corretamente.</p>
        <pre style="background: #333; padding: 10px; border-radius: 8px; font-size: 12px; max-width: 90%; overflow: auto;">${message}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: bold;">Tentar Novamente</button>
      </div>
    `;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
