import { configureStore } from '@reduxjs/toolkit'
import itemsReducer from './slices/itemsSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    items: itemsReducer,
    ui: uiReducer,
  }
})
