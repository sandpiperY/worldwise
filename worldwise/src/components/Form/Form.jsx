import styles from './From.module.css'
import Button from '../Button/Button'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useUrlPosition from '../../hooks/useUrlPosition';
import Message from '../Message/Message';
import ReactCountryFlag from "react-country-flag";
import { useCity } from '../../store/CityContext';

const GEO_BASE_URL =  `https://api.bigdatacloud.net/data/reverse-geocode-client?`;
const BASE_URL = 'http://localhost:8000';

export function convertToEmoji(countryCode){
    const codePoints = countryCode.toUpperCase()
    // console.log(codePoints);
    return codePoints;
}

function Form() {
  const navigate = useNavigate();
  const {lat: urlLat, lng: urlLng} = useUrlPosition();
  const {createCity, isLoading: isLoadingCreateCity} = useCity();

  const [cityName, setCityName] = useState('');
  const [country, setCountry] = useState('');
  const [emoji, setEmoji] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoadingGeolocation, setIsLoadingGeolocation] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);

  useEffect(()=>{
    async function getCityName(){
        if(!urlLat && !urlLng) return;
        setIsLoadingGeolocation(true);
        
        try{
            const res = await fetch(`${GEO_BASE_URL}latitude=${urlLat}&longitude=${urlLng}&localityLanguage=zh-cn`);
            const data = await res.json();
            // console.log(data);

            if (!data) return;

            setCityName(
              data.city || data.locality || data.principalSubdivision || data.countryName
            );
          
            setCountry(data.countryName);
          
            if (data.countryCode) {
              setEmoji(convertToEmoji(data.countryCode));
            } else {
              setEmoji("🏳️");
            }
        }
        catch(error){
            console.error(error);
            setGeolocationError(error.message);
        }
        finally{
            setIsLoadingGeolocation(false);
        }
    }
    getCityName();
  }, [urlLat, urlLng])

  if(geolocationError) return <Message message={geolocationError}/>

  async function handleAdd(e){
    e.preventDefault();
    if(!cityName || !date){
        return alert('请设置位置和日期');
    }
    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: {
        lat: urlLat,
        lng: urlLng,
      }
    }
    createCity(newCity);
    navigate(`/app/cities`, {replace: true});
  }

  return (
    <form className={`${styles.form} ${(isLoadingGeolocation || isLoadingCreateCity) ? styles.loading : ''}`} onSubmit={handleAdd}>
        <div className={styles.row}>
            <label htmlFor="cityName">City name</label>
            <input id="cityName" type="text" 
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
            />
            <span className={styles.flag}>
                <ReactCountryFlag countryCode={emoji} svg/>
            </span>
        </div>
        <div className={styles.row}>
            <label htmlFor="date">When did you go to</label>
            <input id="date" type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
        </div>
        <div className={styles.row}>
            <label htmlFor="notes">Notes about your trip to</label>
            <textarea id="notes" placeholder="Enter your notes here..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>
        <div className={styles.buttons}>
            <Button type="primary">添加</Button>
            <Button type="back" onClick={(e) => {
                e.preventDefault();
                navigate('/app/cities');
            }}>返回</Button>
        </div>
    </form>
  )
}

export default Form