import React,{ createContext, useEffect, useContext, useReducer } from "react";
import { request } from "../config/request";

const BASE_URL = 'http://localhost:1337/api';

interface CityContextType {
  cities: any[];
  currentCity: any;
  isLoading: boolean;
  error: string | null;
  getCity: (documentId: string) => Promise<void>;
  createCity: (city: any) => Promise<void>;
  deleteCity: (documentId: string) => Promise<void>;
}

const initialState = {
  isLoading: false,
  cities: [],
  currentCity: {},
  error: null,
  getCity: async (documentId: string) => {},
  createCity: async (city: any) => {},
  deleteCity: async (documentId: string) => {}
}
const CityContext = createContext(initialState);

const cityReducer = function reducer(state, action){
  switch(action.type){
    case 'loading':
      return ({...state, isLoading: true});
    case 'cities/loaded':
      return ({...state, isLoading: false, cities:(action.payload).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())})
    case 'city/loaded':
      return ({...state, isLoading: false, currentCity:action.payload})
    case 'city/created':
      return ({...state, isLoading: false, 
        cities: [...state.cities, action.payload].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
        currentCity:action.payload})
    case 'city/deleted':
      console.log("delete payload", action.payload);
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

  const fetchData = async ({
    url,
    type,
    documentId,
    method = 'GET',
    body = null,
    skipErrorHandler = false // 可选字段
  }: {
    url: string;
    type: string;
    documentId?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    skipErrorHandler?: boolean;
  }) => {
    body = body ? JSON.stringify({data: body}) : null;
    console.log("body", body);
    try {
      dispatch({ type: 'loading' });

      const res = await request.request<any>({
        url,
        method,
        data: body,
        skipErrorHandler
      });

      if (method.toUpperCase() !== 'DELETE') {
        dispatch({ type: `${type}`, payload: res.data }); // Axios 返回的 data 已封装过
      } else {
        console.log(documentId);
        dispatch({ type: `${type}`, payload: { documentId } });
      }

    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'rejected', payload: e.message || 'Failed to fetch data' });
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