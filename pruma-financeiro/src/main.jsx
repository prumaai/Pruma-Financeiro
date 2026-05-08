import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import PrumaFinanceiro from './App'
import { storage } from './storage.js'

window.storage = storage

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrumaFinanceiro />
  </React.StrictMode>
)
