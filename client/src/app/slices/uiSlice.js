import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeFilter: 'All',
  searchQuery: '',
  view: 'grid',
  selectedItem: null,
  surfaced: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveFilter: (state, action) => { state.activeFilter = action.payload },
    setSearchQuery:  (state, action) => { state.searchQuery  = action.payload },
    setView:         (state, action) => { state.view         = action.payload },
    setSelectedItem: (state, action) => { state.selectedItem = action.payload },
    setSurfaced:     (state, action) => { state.surfaced     = action.payload },
  }
})

export const { setActiveFilter, setSearchQuery, setView, setSelectedItem, setSurfaced } = uiSlice.actions
export default uiSlice.reducer
