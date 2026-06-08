import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Rimuove il vecchio autosave — non più utilizzato
localStorage.removeItem('ideogram-bbox-editor-v1');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
