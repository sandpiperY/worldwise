import Spinner from '../../Spinner/Spinner'
import styles from './CountryList.module.css'
import CountryItem from './CountryItem'
import Message from '../../../components/Message/Message.jsx'
import { useCity } from '../../../store/CityContext.jsx'

function CountryList() {
  const {cities, isLoading} = useCity();

  if(isLoading) return <Spinner/>;
  
  if(!cities || cities.length === 0) {
    return (
      <Message
        message="Add your first city by clicking on a city on the map"
      />
    );
  }
  const countries = cities.reduce((acc, city) => {
    if(!acc.map(item => item.country).includes(city.country)) {
      acc.push({
        id: city.id,
        emoji: city.emoji,
        country: city.country
      });
    }
    return acc;
  }, []);

  // console.log(countries);
  return (
        <ul className={styles.countryList}>
            {countries.map(item => <CountryItem key={item.id} country={item}/>)}
        </ul>
  )
}

export default CountryList