import Logo from "../Logo";
import styles from "./Sidebar.module.css";
import AppNav from "../AppNav";
import { Outlet } from "react-router-dom";

function Sidebar() {
  return (
    <div className={styles.sidebar}>
        <Logo />
        <AppNav />

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