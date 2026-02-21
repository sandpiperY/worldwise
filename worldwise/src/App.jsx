import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'

import HomePage from './Pages/HomePage'
import Product from './Pages/Product'
import Pricing from './Pages/Pricing'
import PageNotFound from './Pages/PageNotFound'
import AppLayout from './Pages/AppLayout'
import Login from './Pages/Login'
import CityList from './components/Sidebar/CityList/CityList'
import CountryList from './components/Sidebar/CountryList/CountryList'
import City from './components/Sidebar/CityList/City/City.jsx'
import Form from './components/Form/Form.jsx'
import {CityProvider} from './store/CityContext'
import { useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

function App() {
  const [isLoggedIn, expiresAt] = useSelector((state) => [state.auth.isLoggedIn, state.auth.expiresAt]);
  const dispatch = useDispatch();
  useEffect(() => {
    const timeout = expiresAt - Date.now();
    if(timeout <= 1000 * 60){
      dispatch(logout());
    }

    const timer = setTimeout(()=>{
      dispatch(logout())
    }, timeout);

    return () => clearTimeout(timer);
  }, [expiresAt]);

  return (
    <CityProvider>
      <Router>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='product' element={<Product />} />
          <Route path='pricing' element={<Pricing />} />
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
      </Router>
    </CityProvider>
  )
}

export default App
