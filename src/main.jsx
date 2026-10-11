import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { isNative } from './lib/native.js'
import './styles/index.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
