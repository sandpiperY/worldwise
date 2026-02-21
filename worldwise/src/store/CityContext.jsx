import { createContext, useEffect, useContext, useReducer } from "react";

const BASE_URL = 'http://localhost:1337/api';
const CityContext = createContext();

const initialState = {
  isLoading: false,
  cities: [],
  currentCity: {},
  error: null
}

const cityReducer = function reducer(state, action){
  switch(action.type){
    case 'loading':
      return ({...state, isLoading: true});
    case 'cities/loaded':
      return ({...state, isLoading: false, cities:(action.payload).sort((a, b) => new Date(a.date) - new Date(b.date))})
    case 'city/loaded':
      return ({...state, isLoading: false, currentCity:action.payload})
    case 'city/created':
      return ({...state, isLoading: false, 
        cities: [...state.cities, action.payload].sort((a, b) => new Date(a.date) - new Date(b.date)), 
        currentCity:action.payload})
    case 'city/deleted':
      return ({...state, isLoading: false,
        cities: state.cities.filter(city => city.documentId !== action.payload.documentId),
        currentCity: {}
      })
    case 'rejected':
      return ({...state, isLoading: false, error: action.payload})
    default:
      return state;
  }
}

function useFetch(){
  const [{isLoading, cities, currentCity, error}, dispatch] = useReducer(cityReducer, initialState);

  const fetchData = async ({ url, type, documentId, method = 'GET', body = null }) => {
    try{
      dispatch({type: 'loading'});
      const res = await fetch(`${BASE_URL}${url}`, {
        method: method,
        body: body ? JSON.stringify({data: body}) : null,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if(res.ok){
        if(method.toUpperCase() !== 'DELETE'){
          const data = await res.json();
          console.log(data);
          dispatch({type: `${type}`, payload: data.data});
        }
        else {
          dispatch({type: `${type}`, payload: {documentId}});
        }

      }else{
        dispatch({type: 'rejected', payload: 'Failed to fetch data'});
      }
    }
    catch(e){
      console.error(e);
      dispatch({type: 'rejected', payload: e.message});
    }
  };
  return {isLoading, cities, currentCity, error, fetchData};
}


// 函数组件，用于提供城市数据
// Context 的 value 一旦发生变化，所有消费组件都会重新渲染
function CityProvider({children}) {
  const { cities, currentCity, isLoading, error, fetchData } = useFetch();
  
  useEffect(()=>{
    fetchData({url: '/cities', type: 'cities/loaded'});
  },[]);

  const getCity = (documentId) => fetchData({ url: `/cities/${documentId}`, type: 'city/loaded', documentId: documentId });

  const createCity = (city) => fetchData({ url: '/cities', type: 'city/created', method: 'POST', body: city });

  const deleteCity = (documentId) => fetchData({ url: `/cities/${documentId}`, type: 'city/deleted', method: 'DELETE', documentId: documentId });


    // 将CityContext传入Provider，使得所有子组件都可以访问到CityContext
  return <CityContext.Provider value={{cities, isLoading, currentCity, error, getCity, createCity, deleteCity}}>
    {children}
  </CityContext.Provider>
}


// 自定义hook，封装context的使用方式，方便在组件中使用
// Hook 只能在“函数组件或自定义 Hook”中调用
function useCity(){
  // 这里的 Context 已经包含了 cityies，isLoading，currentCity，getCity等值和方法，组件通过useCity()来访问这些值和方法
  const context = useContext(CityContext);
  if(!context) throw new Error('CityContext was used outside of the CityProvider');
  return context;
}

export {CityProvider, useCity}