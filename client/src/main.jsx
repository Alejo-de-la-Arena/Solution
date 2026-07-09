import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Tras un deploy, un cliente con el index.html viejo puede pedir chunks con
// hashes que ya no existen. Recargamos una vez (con cooldown para no loopear)
// para que tome los assets nuevos.
const RELOAD_KEY = 'solution_chunk_reload_at';
window.addEventListener('vite:preloadError', (event) => {
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - lastReload > 60_000) {
    event.preventDefault();
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
