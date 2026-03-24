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

/** 解析 Strapi / RTK Query 登录注册错误，避免缺字段导致白屏 */
function getAuthErrorMessage(error) {
  if (!error) return "";
  const data = error.data;
  if (data && typeof data === "object") {
    if (data.error?.message) return String(data.error.message);
    if (typeof data.message === "string") return data.message;
  }
  if (typeof data === "string") return data;
  if (error.status === "FETCH_ERROR" || error.status === "PARSING_ERROR") {
    return "无法连接服务器，请确认后端已启动且地址配置正确";
  }
  if (typeof error.error === "string") return error.error;
  return "登录失败，请检查账号密码后重试";
}

function Login() {

  const [email, setEmail] = useState('user@sample.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password');
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [registerFieldError, setRegisterFieldError] = useState(false);
  const [register, { isSuccess: regSuccess, error: regError, reset: resetRegister }] = useRegisterMutation();
  const [loginUser, { error: loginError, reset: resetLogin }] = useLoginMutation();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {state: locationState} = useLocation();

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
      if (!username?.trim() || !email?.trim() || !password) {
        setRegisterFieldError(true);
        return;
      }
      setRegisterFieldError(false);
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
    resetLogin();
    resetRegister();
    setRegisterFieldError(false);
    setIsLoginForm(!isLoginForm);
  }, [isLoginForm, resetLogin, resetRegister]);


  const loginAlertText =
    isLoginForm && loginError ? getAuthErrorMessage(loginError) : "";
  const registerAlertText = !isLoginForm
    ? regSuccess
      ? "注册成功，正在跳转…"
      : regError
        ? getAuthErrorMessage(regError)
        : registerFieldError
          ? "请填写用户名、邮箱和密码"
          : ""
    : "";
  const alertText = isLoginForm ? loginAlertText : registerAlertText;
  const hasAlert = Boolean(alertText);
  const alertTone =
    !isLoginForm && regSuccess ? "success" : hasAlert ? "error" : "empty";
  const toneClass =
    alertTone === "success"
      ? styles.alertSuccess
      : alertTone === "error"
        ? styles.alertError
        : styles.alertEmpty;

  return (
    <main className={styles.login}>
        <PageNav/>
        <div className={styles.alertSlot}>
          <p
            className={`${styles.alert} ${toneClass}`}
            role={hasAlert ? (isLoginForm ? "alert" : "status") : "presentation"}
          >
            {alertText || "\u00a0"}
          </p>
        </div>
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