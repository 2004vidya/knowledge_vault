import axios from "axios"

const api = axios.create({
    baseURL:"http://localhost:3000",
    withCredentials:true,
    headers:{
        "Content-Type":"application/json"
    }
})

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const createItem = async(data)=>{
    const response = await api.post("/api/items/create-item",data)
    return response.data
}

export const getItems = async()=>{
    const response = await api.get("/api/items/get-items")
    return response.data
}

export const getItemById = async(id)=>{
    const response = await api.get(`/api/items/get-item/${id}`)
    return response.data
}

export const deleteItem = async(id)=>{
    const response = await api.delete(`/api/items/delete-item/${id}`)
    return response.data
}

export const searchItems = async(query)=>{
    const response = await api.get(`/api/items/search-items?query=${query}`)
    return response.data
}

export default api;