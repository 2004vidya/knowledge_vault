import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: []
}

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.list = action.payload
    },
    addItem: (state, action) => {
      state.list.push(action.payload)
    },
    removeItem: (state, action) => {
      state.list = state.list.filter(item => item._id !== action.payload && item.id !== action.payload)
    }
  }
})

export const { setItems, addItem, removeItem } = itemsSlice.actions
export default itemsSlice.reducer
