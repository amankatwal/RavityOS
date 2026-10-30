import {create} from "zustand";
import axios from "axios";

type User ={
    id: string;
    email: string;
    name: string;
    agentCredits: number;
    usuageCredits: number;
    createdAt: Date;
    updatedAt: Date;
}

type AuthStore = {
    user: User | null;
    setNewUser : ()=>void
    userLoader: boolean
}
export const useAuthStore = create<AuthStore>((set, get)=>({
user: null,
userLoader: false,
setNewUser: async()=>{
        if (get().user || get().userLoader) return
    set({userLoader: true})
try {
    const res = await axios.post(`/api/users`)
   set({user: res.data})
} catch (err) {
    console.log(err)
}finally{
    set({userLoader: false})
}
},
}))