import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { adoptOrganisationFromUrl } from './organisation'
import './index.css'

// A pasted `?org=` link becomes the stored tenant; from then on the cookie the
// browser sends with every request is the single source of truth.
adoptOrganisationFromUrl()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)