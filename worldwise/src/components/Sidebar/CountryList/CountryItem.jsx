import styles from './CountryItem.module.css'
import ReactCountryFlag from "react-country-flag";

function CountryItem({ country }) {
    // console.log(country);
    return (
      <li className={styles.countryItem}>
        <span className={styles.emoji} role="img" aria-label={country.country}>
            <ReactCountryFlag
              countryCode={country.emoji}
              svg
              style={{
                width: '2.6rem',
                height: '2.6rem',
              }}
              title={country.country}
            />
        </span>
        <span>{country.country}</span>
      </li>
    );
}

export default CountryItem