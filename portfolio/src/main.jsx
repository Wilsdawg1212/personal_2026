import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode omitted — Three.js scene init must not run twice
createRoot(document.getElementById('root')).render(<App />)
