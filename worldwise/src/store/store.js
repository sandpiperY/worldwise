import {configureStore} from '@reduxjs/toolkit'
import authReducer from './authSlice'
import authApi from './authApi'
import {setupListeners} from '@reduxjs/toolkit/query'

const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
})

setupListeners(store.dispatch);

export default store;