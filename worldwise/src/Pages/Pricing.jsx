import PageNav from '../components/PageNav'
import styles from "./Product.module.css";

function Pricing() {
  return (
    <main className={styles.product}>
    <PageNav />
    <section>
      <div>
        <h2>
          <br />
          月费会员：9元/月
          <br />
          年费会员：99元/年
        </h2>
        <p>
          我们提供两种会员套餐，分别是月费会员和年费会员。
          月费会员价格为9元/月，年费会员价格为99元/年。
          您可以根据自己的需求选择适合自己的套餐。
        </p>
      </div>
      <img src="/img/bg-3.jpg" alt="overview of a large city with skyscrapers" />
    </section>
  </main>
  )
}

export default Pricing