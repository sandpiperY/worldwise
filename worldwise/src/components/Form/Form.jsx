import styles from './From.module.css'
import Button from '../Button/Button'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useUrlPosition from '../../hooks/useUrlPosition';
import Message from '../Message/Message';
import ReactCountryFlag from "react-country-flag";
import { useCity } from '../../store/CityContext';
import { FLAG_ICONS_CDN } from '../../config/flagIconsCdn.js';

const GEO_BASE_URL =  `https://api.bigdatacloud.net/data/reverse-geocode-client?`;

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
  const submitLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              /* 勿存 🏳️：ReactCountryFlag(svg) 需要两位 ISO，否则会拼出错误 URL */
              setEmoji('');
            }
        }
        catch(error){
            console.error(error);
            navigate('/app/cities', { replace: true });
            setGeolocationError(error.message);
        }
        finally{
            setIsLoadingGeolocation(false);
        }
    }
    getCityName();
  }, [urlLat, urlLng])

  if(geolocationError) return <Message message={geolocationError}/>

  async function handleAdd(e) {
    e.preventDefault();
    if (submitLockRef.current || isLoadingCreateCity || isSubmitting) return;
    if (!cityName || !date) {
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
      },
    };
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const created = await createCity(newCity);
      const cityKey =
        created?.documentId != null && created.documentId !== ""
          ? created.documentId
          : created?.id;
      if (cityKey != null && cityKey !== "") {
        navigate(
          `/app/cities/${cityKey}?lat=${urlLat}&lng=${urlLng}`,
          { replace: true }
        );
      } else {
        throw new Error("Failed to create city");
      }
    } catch {
      navigate(`/app/cities`, { replace: true });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`${styles.form} ${(isLoadingGeolocation || isLoadingCreateCity || isSubmitting) ? styles.loading : ''}`} onSubmit={handleAdd}>
        <div className={styles.row}>
            <label htmlFor="cityName">City name</label>
            <input id="cityName" type="text" 
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
            />
            <span className={styles.flag}>
                {/^[A-Za-z]{2}$/.test(emoji) ? (
                  <ReactCountryFlag
                    countryCode={emoji}
                    svg
                    cdnUrl={FLAG_ICONS_CDN}
                  />
                ) : (
                  <span role="img" aria-label="flag">🏳️</span>
                )}
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
            <Button
              type="primary"
              disabled={isLoadingGeolocation || isLoadingCreateCity || isSubmitting}
            >
              添加
            </Button>
            <Button
              type="back"
              htmlType="button"
              disabled={isLoadingCreateCity || isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                navigate('/app/cities');
              }}
            >
              返回
            </Button>
        </div>
    </form>
  )
}

export default Form