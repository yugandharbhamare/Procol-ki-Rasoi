import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

console.log('🚀 Main.jsx: Starting application...')
console.log('🔧 Main.jsx: Environment variables check:')
console.log('  - VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing')
console.log('  - VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing')
console.log('  - VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Missing')

// Global error handlers to prevent async channel errors
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the error from showing in console
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Check if it's the async channel error
  if (event.message && event.message.includes('message channel closed before a response was received')) {
    console.warn('Async channel error caught and handled:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle message channel errors specifically
window.addEventListener('message', (event) => {
  // This can help prevent message channel issues
  if (event.data && typeof event.data === 'object') {
    // Handle any message channel related data
  }
});

try {
  console.log('🔧 Main.jsx: Creating React root...')
  const root = ReactDOM.createRoot(document.getElementById('root'))
  
  console.log('🔧 Main.jsx: Importing components...')
  console.log('  - App component:', typeof App)
  console.log('  - AuthProvider component:', typeof AuthProvider)
  console.log('  - ErrorBoundary component:', typeof ErrorBoundary)
  
  console.log('🔧 Main.jsx: Rendering application...')
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('✅ Main.jsx: Application rendered successfully')
} catch (error) {
  console.error('❌ Main.jsx: Failed to render application:', error)
  // Fallback error display
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Application Failed to Load</h1>
        <p>Error: ${error.message}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
      </div>
    `
  }
} 