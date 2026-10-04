import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeTheme } from './apis/theme.js'
import './index.css'

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
