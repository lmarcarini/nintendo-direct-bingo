import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { readCard } from './utils/cardUrl.ts'
import './index.css'

// Decoding the card from the URL is async (decompression), so wait before rendering
const initialCard = await readCard(new URL(window.location.href))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App initialCard={initialCard} />
  </React.StrictMode>,
)
