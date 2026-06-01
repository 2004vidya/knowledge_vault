import { StrictMode } from 'react'
import {Provider} from "react-redux";
import { store } from "./app/store";
import { createRoot } from 'react-dom/client'
import './app/index.css'
import App from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
