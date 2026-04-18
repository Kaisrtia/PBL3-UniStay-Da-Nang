import React from 'react'

import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Bọc App lại như thế này */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)