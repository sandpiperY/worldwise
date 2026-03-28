import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import React, { Suspense } from 'react'

const HomePage = React.lazy(() => import('./Pages/HomePage'))
const Product = React.lazy(() => import('./Pages/Product'))
const Pricing = React.lazy(() => import('./Pages/Pricing'))
const AIAssistant = React.lazy(() => import('./Pages/AIAssistant'))
const PageNotFound = React.lazy(() => import('./Pages/PageNotFound'))
const AppLayout = React.lazy(() => import('./Pages/AppLayout'))
const Login = React.lazy(() => import('./Pages/Login'))
const CityList = React.lazy(() => import('./components/Sidebar/CityList/CityList'))
const CountryList = React.lazy(() => import('./components/Sidebar/CountryList/CountryList'))
const City = React.lazy(() => import('./components/Sidebar/CityList/City/City.jsx'))
const Form = React.lazy(() => import('./components/Form/Form.jsx'))
import Spinner from './components/Spinner/Spinner'
import {CityProvider} from './store/CityContext'
import { useDispatch } from 'react-redux';
import { login, logout } from './store/authSlice';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { usesSessionCookie } from './config/strapiBase.js';

function App() {
  const [isLoggedIn, expiresAt] = useSelector((state) => [state.auth.isLoggedIn, state.auth.expiresAt]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!usesSessionCookie()) return;
    fetch('/api/session/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) dispatch(login({ user: data.user }));
      })
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!expiresAt) return;
    const timeout = expiresAt - Date.now();
    if (timeout <= 1000 * 60) {
      dispatch(logout());
      return;
    }
    const timer = setTimeout(() => dispatch(logout()), timeout);
    return () => clearTimeout(timer);
  }, [expiresAt, dispatch]);

  return (
    <CityProvider>
      <Router>
        <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='product' element={<Product />} />
          <Route path='pricing' element={<Pricing />} />
          <Route path='ai-assistant' element={isLoggedIn ? <AIAssistant /> : <Navigate to='/login' replace/>} />
          <Route path='login' element={<Login />} />
          <Route path='app' element={isLoggedIn ? <AppLayout /> : <Navigate to='/login' replace/>} >
            <Route index element={<Navigate to='cities' replace/>}/>
            <Route path='cities' element={<CityList/>}/>
            <Route path='cities/:id' element={<City />}/>
            <Route path='countries' element={<CountryList/>}/>
            <Route path='form' element={<Form />}/>
          </Route>
          <Route path='*' element={<PageNotFound />} />
        </Routes>
        </Suspense>
      </Router>
    </CityProvider>
  )
}

export default App
