import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import NewsPreviewPage from './components/pages/NewsPreviewPage.jsx'
import { initializeTheme } from './apis/theme.js'
import './index.css'

initializeTheme()

// Keep local article previews separate from the app's match subscriptions and writes.
const previewDateId = import.meta.env.DEV
  ? /^\/news-preview\/(\d{6})\/?$/.exec(window.location.pathname)?.[1] : null

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {previewDateId ? <NewsPreviewPage dateId={previewDateId} /> : <App />}
  </React.StrictMode>,
)
