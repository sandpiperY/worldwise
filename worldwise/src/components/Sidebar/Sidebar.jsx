import Logo from "../Logo";
import styles from "./Sidebar.module.css";
import AppNav from "../AppNav";
import { Outlet } from "react-router-dom";
import { useCity } from "../../store/CityContext";

function formatConnectionError(message) {
  if (!message) return "";
  const m = String(message);
  if (m === "Network Error" || /network/i.test(m) || /ERR_CONNECTION|ECONNREFUSED|Failed to fetch/i.test(m)) {
    return "无连接：请确认 Strapi 后端已启动（默认 http://localhost:1337）";
  }
  return m;
}

function Sidebar() {
  const { error } = useCity();
  const text = error ? formatConnectionError(error) : "";

  return (
    <div className={styles.sidebar}>
        <Logo />
        <AppNav />

        <div
          className={styles.connectionSlot}
          data-visible={Boolean(error)}
          role={error ? "alert" : "presentation"}
        >
          <p className={styles.connectionText}>{text || "\u00a0"}</p>
        </div>

        {/* 占位符，匹配到子元素路由时，渲染到这里 */}
        <Outlet />
        <footer className={styles.footer}>
            <p className={styles.copyright}>
                &copy; Copyright {new Date().getFullYear()} by WorldWise Inc.
            </p>
        </footer>
    </div>
  )
}

export default Sidebar