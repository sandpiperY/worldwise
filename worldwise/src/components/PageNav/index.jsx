import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './PageNav.module.css'
import Logo from '../Logo'
import { useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useDispatch } from 'react-redux';

function PageNav({ className }) {
  const dispatch = useDispatch();
  const [isLoggedIn, user] = useSelector((state) => [state.auth.isLoggedIn, state.auth.user]);
  const logoutHandler = (e) => {
    if(confirm('是否确定退出登录？')){
      e.preventDefault();
      dispatch(logout());
    }
  };
  return (
    <nav className={`${styles.nav} ${className}`}>
      <Logo />
      <ul>
          {isLoggedIn ? <li className={styles.user}>hello, {user?.username}</li> : null}
          <li><NavLink to='/'>主页</NavLink></li>
          <li><NavLink to='/pricing'>会员</NavLink></li>
          <li>{isLoggedIn ? <a href="#" onClick={logoutHandler}>退出登录</a> : <NavLink to='/login'>登录</NavLink>}</li>
          <li><NavLink to='/product'>关于WorldWise</NavLink></li>
      </ul>
    </nav>
  )
}

export default PageNav