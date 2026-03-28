import styles from './CountryItem.module.css'
import ReactCountryFlag from "react-country-flag";
import { FLAG_ICONS_CDN } from "../../../config/flagIconsCdn.js";

function CountryItem({ country }) {
    // console.log(country);
    return (
      <li className={styles.countryItem}>
        <span className={styles.emoji} role="img" aria-label={country.country}>
            <ReactCountryFlag
              countryCode={country.emoji}
              svg
              cdnUrl={FLAG_ICONS_CDN}
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