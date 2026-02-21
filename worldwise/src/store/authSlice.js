import {createSlice} from '@reduxjs/toolkit'

const authSlice = createSlice({
    name: 'auth',
    initialState: () =>{
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if(token && user){
            return {
                isLoggedIn: true,
                token,
                user:JSON.parse(user),
                expiresAt: localStorage.getItem('expiresAt') || 0,
            }
        }

        return {
            isLoggedIn: false,
            token: null,
            user: null,
            expiresAt: 0,
        }
    },
    reducers: {
        login: (state, action) => {
            state.isLoggedIn = true;
            state.token = action.payload.token;
            state.user = action.payload.user;
            const currentTime = new Date().getTime();
            const timeout = 1000 * 60 * 60 * 24 * 7; // 7天
            state.expiresAt = currentTime + timeout;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('expiresAt', state.expiresAt);
        },

        logout: (state) => {
            state.isLoggedIn = false;
            state.token = null;
            state.user = null;
            state.expiresAt = 0;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('expiresAt');
        }
    }
})

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;