import { useState, useCallback } from 'react';
import PageNav from '../components/PageNav';
import styles from './Login.module.css';
import Button from '../components/Button/Button.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login as authLogin } from '../store/authSlice.js';
import { getStrapiApiBase, usesSessionCookie } from '../config/strapiBase.js';

function getAuthErrorMessage(error) {
  if (!error) return '';
  const data = error.data;
  if (data && typeof data === 'object') {
    if (data.error?.message) return String(data.error.message);
    if (typeof data.message === 'string') return data.message;
  }
  if (typeof data === 'string') return data;
  if (error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR') {
    return '无法连接服务器，请确认后端已启动且地址配置正确';
  }
  if (typeof error.error === 'string') return error.error;
  return '登录失败，请检查账号密码后重试';
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function Login() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [registerFieldError, setRegisterFieldError] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();

  const emailChangeHandler = useCallback((e) => {
    setEmail(e.target.value);
    setRegisterFieldError(false);
  }, []);
  const passwordChangeHandler = useCallback((e) => {
    setPassword(e.target.value);
    setRegisterFieldError(false);
  }, []);
  const usernameChangeHandler = useCallback((e) => {
    setUsername(e.target.value);
    setRegisterFieldError(false);
  }, []);

  const submitHandler = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError(null);
      setRegisterError(null);
      if (isLoginForm) {
        if (usesSessionCookie()) {
          const res = await fetch('/api/session/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email, password })
          });
          const data = await parseJsonSafe(res);
          if (!res.ok) {
            setLoginError({ data, status: res.status });
            return;
          }
          dispatch(authLogin({ user: data.user }));
          navigate(locationState?.from || '/app');
          return;
        }
        const res = await fetch(`${getStrapiApiBase()}/auth/local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password })
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) {
          setLoginError({ data, status: res.status });
          return;
        }
        dispatch(authLogin({ token: data.jwt, user: data.user }));
        navigate(locationState?.from || '/app');
        return;
      }

      if (!username?.trim() || !email?.trim() || !password) {
        setRegisterFieldError(true);
        return;
      }
      setRegisterFieldError(false);
      if (usesSessionCookie()) {
        const res = await fetch('/api/session/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) {
          setRegisterError({ data, status: res.status });
          return;
        }
        setRegSuccess(true);
        dispatch(authLogin({ user: data.user }));
        setTimeout(() => navigate(locationState?.from || '/app'), 2000);
        return;
      }
      const res = await fetch(`${getStrapiApiBase()}/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setRegisterError({ data, status: res.status });
        return;
      }
      setRegSuccess(true);
      dispatch(authLogin({ token: data.jwt, user: data.user }));
      setTimeout(() => navigate(locationState?.from || '/app'), 2000);
    },
    [email, password, isLoginForm, username, dispatch, navigate, locationState?.from]
  );

  const toggleFormHandler = useCallback((e) => {
    e.preventDefault();
    setLoginError(null);
    setRegisterError(null);
    setRegSuccess(false);
    setRegisterFieldError(false);
    setIsLoginForm(!isLoginForm);
  }, [isLoginForm]);

  const loginAlertText =
    isLoginForm && loginError ? getAuthErrorMessage(loginError) : '';
  const registerAlertText = !isLoginForm
    ? regSuccess
      ? '注册成功，正在跳转…'
      : registerError
        ? getAuthErrorMessage(registerError)
        : registerFieldError
          ? '请填写用户名、邮箱和密码'
          : ''
    : '';
  const alertText = isLoginForm ? loginAlertText : registerAlertText;
  const hasAlert = Boolean(alertText);
  const alertTone =
    !isLoginForm && regSuccess ? 'success' : hasAlert ? 'error' : 'empty';
  const toneClass =
    alertTone === 'success'
      ? styles.alertSuccess
      : alertTone === 'error'
        ? styles.alertError
        : styles.alertEmpty;

  return (
    <main className={styles.login}>
      <PageNav />
      <div className={styles.alertSlot}>
        <p
          className={`${styles.alert} ${toneClass}`}
          role={hasAlert ? (isLoginForm ? 'alert' : 'status') : 'presentation'}
        >
          {alertText || '\u00a0'}
        </p>
      </div>
      <form className={styles.form}>
        {!isLoginForm && (
          <div className={styles.row}>
            <label htmlFor='username'>用户名</label>
            <input type='text' id='username' value={username} onChange={usernameChangeHandler} />
          </div>
        )}
        <div className={styles.row}>
          <label htmlFor='email'>注册邮箱</label>
          <input type='email' id='email' value={email} onChange={emailChangeHandler} />
        </div>
        <div className={styles.row}>
          <label htmlFor='password'>密码</label>
          <input type='password' id='password' value={password} onChange={passwordChangeHandler} />
        </div>
        <div className={styles.buttons}>
          <Button type='primary' onClick={submitHandler}>
            {isLoginForm ? '登录' : '注册'}
          </Button>
          <Button type='primary' onClick={toggleFormHandler}>
            {isLoginForm ? '创建新账户' : '已有账户，直接登录'}
          </Button>
        </div>
      </form>
    </main>
  );
}

export default Login;
