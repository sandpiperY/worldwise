import Spinner from '../../Spinner/Spinner'
import styles from './CityList.module.css'
import CityItem from './CityItem'
import Message from '../../../components/Message/Message.jsx'
import { useCity } from '../../../store/CityContext'

function CityList() {
  const {cities, isLoading} = useCity();
  if(isLoading) return <Spinner/>;
  
  if(!cities || cities.length === 0) {
    return (
      <Message
        message="Add your first city by clicking on a city on the map"
      />
    );
  }

  return (
        <ul className={styles.cityList}>
            {cities.map(item => <CityItem key={item.id} city={item}/>)}
        </ul>
  )
}

export default CityList