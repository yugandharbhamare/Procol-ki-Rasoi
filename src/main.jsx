import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Suppress known browser extension errors only
window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason || '');
  if (reason.includes('message channel closed') || reason.includes('Extension context invalidated')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('message channel closed before a response was received')) {
    event.preventDefault();
    return false;
  }
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Failed to render application:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    const container = document.createElement('div')
    container.style.cssText = 'padding: 20px; font-family: Arial, sans-serif;'

    const heading = document.createElement('h1')
    heading.style.color = 'red'
    heading.textContent = 'Application Failed to Load'

    const message = document.createElement('p')
    message.textContent = 'Something went wrong. Please try reloading the page.'

    const button = document.createElement('button')
    button.textContent = 'Reload Page'
    button.style.cssText = 'padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;'
    button.addEventListener('click', () => window.location.reload())

    container.append(heading, message, button)
    rootElement.appendChild(container)
  }
} 