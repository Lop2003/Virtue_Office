import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import './index.css'
import App from './App.tsx'

// Enable global Three.js loader cache for better asset loading performance
THREE.Cache.enabled = true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
