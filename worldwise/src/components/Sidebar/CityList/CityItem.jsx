import {Link} from "react-router-dom"
import ReactCountryFlag from "react-country-flag";
import styles from "./CityItem.module.css";
import { useCity } from "../../../store/CityContext";
import { useNavigate } from "react-router-dom";

const formatDate = (date) =>
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date));

function CityItem({city}) {
  const navigate = useNavigate();
  const {deleteCity, isLoading: isLoadingDeleteCity} = useCity();
  const {documentId, position, country, emoji, cityName, date} = city;
  const {currentCity} = useCity();
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this city?')) {
      deleteCity(documentId);
      navigate(`/app/cities`);
    }
  }
  return (
    <li>
        <Link className={`${styles.cityItem} ${currentCity.documentId === documentId ? styles['cityItem--active'] : ''}`} 
            to={`${documentId}?lat=${position.lat}&lng=${position.lng}`}>
            <span className={styles.emoji} role="img" aria-label={country}>
                <ReactCountryFlag
                countryCode={emoji}
                svg
                style={{
                    width: '2.6rem',
                    height: '2.6rem',
                    }}
                    title={country}
                    />
            </span>
            <span className={styles.name}>{cityName}</span>
            <time className={styles.date}>({formatDate(date)})</time>
            <button className={styles.deleteBtn} onClick={handleDelete}>&times;</button>
        </Link>
    </li>
  )
}

export default CityItem