import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("📤 Sending token in header");
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export async function register({ email, username, password }) {
  try {
    console.log("🔄 Attempting registration with:", { email, username });
    const response = await api.post("/api/auth/register", {
      email,
      username,
      password,
    });
    console.log("✅ Register successful");
    console.log("📦 Response data:", response.data);
    
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      console.log("💾 Token stored in localStorage");
      console.log("✔️ Verification - Token in localStorage:", localStorage.getItem("token"));
    } else {
      console.log("❌ No token in response data!");
    }
    return response.data;
  } catch (error) {
    console.log("❌ Register error:", error);
    console.log("❌ Error response:", error.response?.data);
    throw error;
  }
}

export async function login({ email, password }) {
  try {
    console.log("🔄 Attempting login with email:", email);
    const response = await api.post("/api/auth/login", { email, password });
    console.log("✅ Login successful");
    console.log("📦 Full response:", response);
    console.log("📦 Response data:", response.data);
    console.log("🔑 Token from response:", response.data.token);
    
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      console.log("💾 Token stored in localStorage");
      console.log("✔️ Verification - Token in localStorage:", localStorage.getItem("token"));
    } else {
      console.log("❌ No token in response data!");
    }
    return response.data;
  } catch (error) {
    console.log("❌ Login error:", error);
    console.log("❌ Error response:", error.response?.data);
    throw error;
  }
}

export async function getMe(){
    try{
    const response = await api.get("/api/auth/me")
    return response.data;
    }catch(error){
        console.log(error);
        throw error;
    }
}

export function logout() {
  localStorage.removeItem("token");
  console.log("🗑️ Token removed from localStorage");
}

export default api;