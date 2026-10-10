import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AboutKexingPage from './AboutKexingPage'
import './about-kexing.css'

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<StrictMode><AboutKexingPage /></StrictMode>)
