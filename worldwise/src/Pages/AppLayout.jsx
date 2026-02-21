import styles from './AppLayout.module.css'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Map from '../components/Map/Map.jsx'
import PageNav from '../components/PageNav'

function AppLayout() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <Map/>
    </div>
  )
}

export default AppLayout