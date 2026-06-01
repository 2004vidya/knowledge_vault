import { register,login,getMe } from "../service/auth.api";


export default function useAuth() {

    const registerUser = async(data)=>{
        try {
            const response = await register(data)
            return response
        } catch (error) {
            console.log(error)
             throw error
        }
    }  
    
    const loginUser = async(data)=>{
        try {
            const response = await login(data)
            return response
        } catch (error) {
            console.log(error)
             throw error
        }
    }

    const fetchCurrentUser = async()=>{
        try {
            const response = await getMe()
            return response
        } catch (error) {
            console.log(error)
             throw error
        }  
    }  

    return{
        registerUser,
        loginUser,
        fetchCurrentUser
    }

}