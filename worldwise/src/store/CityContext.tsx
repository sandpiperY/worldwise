import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { request } from "../config/request";

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
      return { ...state, isLoading: true, error: null };
    case 'cities/loaded':
      return {
        ...state,
        isLoading: false,
        error: null,
        cities: (action.payload).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      };
    case 'city/loaded':
      return { ...state, isLoading: false, error: null, currentCity: action.payload };
    case 'city/created':
      return {
        ...state,
        isLoading: false,
        error: null,
        cities: [...state.cities, action.payload].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        currentCity: action.payload,
      };
    case 'city/deleted':
      console.log("delete payload", action.payload);
      return {
        ...state,
        isLoading: false,
        error: null,
        cities: state.cities.filter((city) => city.documentId !== action.payload.documentId),
        currentCity: {},
      };
    case 'rejected':
      return ({...state, isLoading: false, error: action.payload})
    default:
      return state;
  }
}

function useFetch() {
  const [{ isLoading, cities, currentCity, error }, dispatch] = useReducer(
    cityReducer,
    initialState
  );

  // useReducer 的 dispatch 引用稳定，故 fetchData 可长期保持同一引用，避免 Context value 无谓变化
  const fetchData = useCallback(
    async ({
      url,
      type,
      documentId,
      method = "GET",
      body = null,
      skipErrorHandler = false,
    }: {
      url: string;
      type: string;
      documentId?: string;
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: any;
      skipErrorHandler?: boolean;
    }) => {
      body = body ? JSON.stringify({ data: body }) : null;
      console.log("body", body);
      try {
        dispatch({ type: "loading" });

        const res = await request.request<any>({
          url,
          method,
          data: body,
          skipErrorHandler,
        });

        if (method.toUpperCase() !== "DELETE") {
          dispatch({ type: `${type}`, payload: res.data });
        } else {
          console.log(documentId);
          dispatch({ type: `${type}`, payload: { documentId } });
        }
      } catch (e: any) {
        console.error(e);
        dispatch({
          type: "rejected",
          payload: e.message || "Failed to fetch data",
        });
      }
    },
    []
  );

  return { isLoading, cities, currentCity, error, fetchData };
}


// 函数组件，用于提供城市数据
// value 使用 useMemo + 稳定回调，避免 Provider 因父组件重渲染而传入「新对象」导致 consumer 无谓更新
function CityProvider({ children }: { children: React.ReactNode }) {
  const { cities, currentCity, isLoading, error, fetchData } = useFetch();

  useEffect(() => {
    fetchData({ url: "/cities", type: "cities/loaded" });
  }, [fetchData]);

  const getCity = useCallback(
    (documentId: string) =>
      fetchData({
        url: `/cities/${documentId}`,
        type: "city/loaded",
        documentId,
      }),
    [fetchData]
  );

  const createCity = useCallback(
    (city: any) =>
      fetchData({
        url: "/cities",
        type: "city/created",
        method: "POST",
        body: city,
      }),
    [fetchData]
  );

  const deleteCity = useCallback(
    (documentId: string) =>
      fetchData({
        url: `/cities/${documentId}`,
        type: "city/deleted",
        method: "DELETE",
        documentId,
      }),
    [fetchData]
  );

  const value = useMemo(
    () => ({
      cities,
      isLoading,
      currentCity,
      error,
      getCity,
      createCity,
      deleteCity,
    }),
    [
      cities,
      isLoading,
      currentCity,
      error,
      getCity,
      createCity,
      deleteCity,
    ]
  );

  return (
    <CityContext.Provider value={value}>{children}</CityContext.Provider>
  );
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