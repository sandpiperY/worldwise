import PageNav from '../components/PageNav'
import styles from "./Product.module.css";

function Product() {
  return (
    <main className={styles.product}>
    <PageNav />
    <section>
      <img
        src="/img/bg-2.jpg"
        alt="person with dog overlooking mountain with sunset"
      />
      <div>
        <h2>关于 WorldWise</h2>
        <p>
          WorldWise 致力于提供一个简单、易用、美观的旅行记录应用，帮助您记录并生动呈现全球各地的精彩旅程。
        </p>
        <p>
          您可以在WorldWise的世界地图界面上轻松标记每一座到访的城市，记录下每一个难忘的瞬间，
          并与朋友和家人分享您的旅程。
        </p>
      </div>
    </section>
  </main>
  )
}

export default Product