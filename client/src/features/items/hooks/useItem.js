import { useCallback } from "react";
import { createItem, getItems, getItemById, deleteItem, searchItems } from "../service/item.api.js";

export default function useItem() {

    const createNewItem = useCallback(async (data) => {
        try {
            const response = await createItem(data)
            return response
        } catch (error) {
            console.log(error)
             throw error
        }
    }, []);

    const fetchItems = useCallback(async () => {
        try {
            const response = await getItems()
            return response
        } catch (error) {
            throw error
        }
    }, []);

    const fetchItemById = useCallback(async (id) => {
        try {
            const response = await getItemById(id)
            return response
        } catch (error) {
            throw error
        }
    }, []);

    const removeItem = useCallback(async (id) => {
        try {
            const response = await deleteItem(id)
            return response
        } catch (error) {
            throw error
        }
    }, []);

    const searchForItems = useCallback(async (query) => {
        try {
            const response = await searchItems(query)
            return response
        } catch (error) {
            throw error
        }
    }, []);

    return {
        createNewItem,
        fetchItems,
        fetchItemById,
        removeItem,
        searchForItems
    }
}