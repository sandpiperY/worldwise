import { createSlice } from '@reduxjs/toolkit';
import { usesSessionCookie } from '../config/strapiBase.js';

const weekMs = 1000 * 60 * 60 * 24 * 7;

function buildInitialAuthState() {
  if (usesSessionCookie()) {
    return {
      isLoggedIn: false,
      user: null,
      token: null,
      expiresAt: 0,
      sessionBootstrapped: false
    };
  }
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    return {
      isLoggedIn: true,
      token,
      user: JSON.parse(user),
      expiresAt: Number(localStorage.getItem('expiresAt')) || 0,
      sessionBootstrapped: true
    };
  }
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    expiresAt: 0,
    sessionBootstrapped: true
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: buildInitialAuthState(),
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.sessionBootstrapped = true;
      const now = Date.now();
      state.expiresAt = action.payload.expiresAt ?? now + weekMs;
      if (usesSessionCookie()) {
        state.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
      } else {
        state.token = action.payload.token ?? null;
        if (state.token) localStorage.setItem('token', state.token);
        localStorage.setItem('user', JSON.stringify(state.user));
        localStorage.setItem('expiresAt', String(state.expiresAt));
      }
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
      state.user = null;
      state.expiresAt = 0;
      state.sessionBootstrapped = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
    },
    sessionBootstrapDone: (state) => {
      state.sessionBootstrapped = true;
    }
  }
});

export const { login, logout, sessionBootstrapDone } = authSlice.actions;
export default authSlice.reducer;
