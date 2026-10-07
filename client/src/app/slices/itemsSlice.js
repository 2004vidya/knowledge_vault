import {createSlice} from "@reduxjs/toolkit";

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
        },
        updateItem: (state, action) => {
            const updated = action.payload;
            const index = state.list.findIndex((i) => (i._id || i.id) === (updated._id || updated.id));
            if (index !== -1) {
                state.list[index] = {
                    ...state.list[index],
                    ... updated
                };
            }
        }

    }
})

export const {setItems, addItem, removeItem,updateItem} = itemsSlice.actions
export default itemsSlice.reducer
