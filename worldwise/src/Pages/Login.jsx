import { useState, useCallback } from "react";
import PageNav from "../components/PageNav";
import styles from "./Login.module.css";
import Button from "../components/Button/Button.jsx";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../store/authApi";
import { useLoginMutation } from "../store/authApi";
import { useLocation } from "react-router-dom";
import store from "../store/store.js";
import { login as authLogin } from "../store/authSlice.js";

function Login() {

  const [email, setEmail] = useState('user@sample.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password');
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [register, {isSuccess: regSuccess, error: regError}] = useRegisterMutation();
  const [loginUser, {error: loginError}] = useLoginMutation();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {state: locationState} = useLocation();

  const emailChangeHandler = useCallback((e) => {
    setEmail(e.target.value);
  }, []);
  const passwordChangeHandler = useCallback((e) => {
    setPassword(e.target.value);
  }, []);
  const usernameChangeHandler = useCallback((e) => {
    setUsername(e.target.value);
  }, []);
  const submitHandler = useCallback((e) => {
    e.preventDefault();
    if(isLoginForm) {
      console.log('登录', email, password);
      loginUser({identifier: email, password}).
      then(res => {
        if(res.error) {
          console.log(res.error);
        } else {
          dispatch(authLogin({token: res.data.jwt, user: res.data.user}));
          console.log(store.getState().auth);
          navigate(locationState?.from || '/app');
        }
      })
    } else {
      if (!username || !email || !password) {
        console.log('请填写用户名、邮箱和密码');
        return;
      }
      console.log('注册', email, password);
      register({username, email, password})
      .then(res => {
        if(res.error) {
          console.log(res.error);
        }
        else{
          dispatch(authLogin({token: res.data.jwt, user: res.data.user}));
          setTimeout(() => {
            navigate(locationState?.from || '/app');
          }, 2000);
        }
      })
    }
  }, [email, password, isLoginForm, username]);

  const toggleFormHandler = useCallback((e) => {
    e.preventDefault();
    setIsLoginForm(!isLoginForm);
  }, [isLoginForm]);


  return (
    <main className={styles.login}>
        <PageNav/>
        <p style={{color: regSuccess ? 'green' : regError ? 'red' : 'black'}}>
            {regSuccess ? '注册成功, 等待跳转...' : regError ? regError.data.error.message : ''}
        </p>
        <p style={{color: 'red'}}>
            {loginError ? loginError.data.error.message : ''}
        </p>
        <form className={styles.form}>
          {
            !isLoginForm && (
              <div className={styles.row}>
                <label htmlFor="username">用户名</label>
                <input type="text" id="username" value={username} onChange={usernameChangeHandler}/>
              </div>
            )
          }
            <div className={styles.row}>
                <label htmlFor="email">注册邮箱</label>
                <input type="email" id="email" value={email} onChange={emailChangeHandler}/>
            </div>
            <div className={styles.row}>
                <label htmlFor="password">密码</label>
                <input type="password" id="password" value={password} onChange={passwordChangeHandler}/>
            </div>
            <div className={styles.buttons}>
                <Button type="primary" onClick={submitHandler}>{isLoginForm ? '登录' : '注册'}</Button>
                <Button type="primary" onClick={toggleFormHandler}>{isLoginForm ? '创建新账户' : '已有账户，直接登录'}</Button>
            </div>
        </form>
    </main>
  )
}

export default Login