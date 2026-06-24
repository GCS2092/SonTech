import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OneSignal from 'react-onesignal'

OneSignal.init({
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
  notifyButton: { enable: false },
  allowLocalhostAsSecureOrigin: true,
  // ✅ Chemin explicite vers notre worker dans public/
  serviceWorkerParam: { scope: '/' },
  serviceWorkerPath: '/OneSignalSDKWorker.js',
  // ✅ On dit à OneSignal de NE PAS utiliser le sw.js de Vite PWA
  serviceWorkerUpdaterPath: '/OneSignalSDKWorker.js',
}).then(() => {
  console.log('OneSignal initialisé ✅')
}).catch((err) => {
  console.error('OneSignal init error:', err)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)