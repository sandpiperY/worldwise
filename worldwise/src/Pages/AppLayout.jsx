import styles from './AppLayout.module.css'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Map from '../components/Map/Map.jsx'

function AppLayout() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <Map/>
    </div>
  )
}

export default AppLayout