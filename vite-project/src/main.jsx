import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.jsx'
import { loadSavedTheme } from './utils/theme.js'

loadSavedTheme(); // Apply before first paint to prevent theme flash

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
