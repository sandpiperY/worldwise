import PageNav from '../components/PageNav'
import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'
import { useSelector } from 'react-redux';

function HomePage() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  return (
    <main className={styles.homepage}>
      <PageNav />
      <section>
        <h1>
          WorldWise
          <br />
          探索世界的每一步，留下你旅途的足迹
        </h1>
        <h2>
          无论你走过多少城市，跨越多少国界，都能轻松记录下你的世界之旅。
          与朋友们分享你的冒险，展示你走过的每个精彩瞬间，带着他们一起感受你探索世界的旅程。
        </h2>
        <Link to={isLoggedIn ? "/app" : "/login"} className="cta">
          开始记录你的旅程
        </Link>
      </section>
    </main>
  )
}

export default HomePage