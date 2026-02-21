import styles from "./Map.module.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCity } from "../../store/CityContext";
import { AMAP_CONFIG } from "../../config/amap";
import useGeolocation from "../../hooks/useGeolocation";
import Button from "../Button/Button";
import useUrlPosition from "../../hooks/useUrlPosition";

function Map() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // AMap.Map (地图实例) 的引用
  const markersRef = useRef([]); // 标记组件的引用数组
  const { cities } = useCity();
  const [mapLoaded, setMapLoaded] = useState(false);
  const {isLoading: isLoadingPosition, position: localPosition, getPosition} = useGeolocation();
  const {lat: urlLat, lng: urlLng} = useUrlPosition();
  const initializedRef = useRef(false);
  
  // 使用 useState 存储坐标，避免不必要的重新渲染和地图更新
  const [mapCenter, setMapCenter] = useState(() => {
    console.log('mapCenter state initialized');
    
    if (urlLat && urlLng) {
      initializedRef.current = true;
      return { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
    }

    // 第一次且没有参数：用默认中心
    initializedRef.current = true;
    return {
      lat: AMAP_CONFIG.DEFAULT_CENTER[1],
      lng: AMAP_CONFIG.DEFAULT_CENTER[0],
    };
  });
  
  // 同步 URL 参数到 state，只在值真正变化时更新
  useEffect(() => {
    if (urlLat && urlLng) {
      const newLat = parseFloat(urlLat);
      const newLng = parseFloat(urlLng);

      if (isNaN(newLat) || isNaN(newLng)) return;
      
      // 只在坐标真正变化时更新 state，避免重复更新
      if (!mapCenter || mapCenter.lat !== newLat || mapCenter.lng !== newLng) {
        setMapCenter({ lat: newLat, lng: newLng });
        console.log('[Map] mapCenter updated', mapCenter);
      }
    } 
  }, [urlLat, urlLng, mapCenter]);

  const initMap = useCallback(() => {
    if (!window.AMap || !mapRef.current) return;
    
    // 如果已经有地图实例了，说明已经初始化过，直接复用，避免中心被重置
    if (mapInstanceRef.current) {
      return;
    }

    // 初始化地图（只在第一次或组件真正卸载后再次挂载时执行）
    try {
      console.log('map initialized');
      const map = new window.AMap.Map(mapRef.current, {
        zoom: AMAP_CONFIG.DEFAULT_ZOOM,
        center: AMAP_CONFIG.DEFAULT_CENTER,
        viewMode: '3D',
        mapStyle: AMAP_CONFIG.MAP_STYLE,
      });

      mapInstanceRef.current = map;
      
      // 等待地图完全加载后再设置 mapLoaded
      map.on('complete', () => {
        setMapLoaded(true);
      });
      
      // 添加地图点击事件，跳转到表单页面
      map.on('click', (e) => {
        const { lng, lat } = e.lnglat;
        navigate(`/app/form?lat=${lat}&lng=${lng}`);
      });
    } catch (e) {
      console.error('Failed to initialize map:', e);
      setMapLoaded(false);
    }
  }, []);

  useEffect(() => {
    // 动态加载高德地图 JS API
    if (!window.AMap) {
      // 检查是否已经添加过脚本标签，避免重复添加
      const existingScript = document.querySelector('script[src*="webapi.amap.com"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_CONFIG.Web_KEY}&callback=initAMap`;
        script.async = true;
        script.defer = true;
        script.id = 'amap-script';
        
        // 通过回调函数设置window.AMap加载完成后再初始化地图
        window.initAMap = () => {
          initMap();
        };
        
        document.head.appendChild(script);
      } else {
        // 已经插入了高德地图的脚本，但window.AMap还没有完全加载
        // 每 100 毫秒检查一次 window.AMap 是否已经加载完成。
        const checkAMap = setInterval(() => {
          if (window.AMap) {
            clearInterval(checkAMap);
            initMap();
          }
        }, 100);
        
        // 10秒后停止检查
        setTimeout(() => clearInterval(checkAMap), 10000);
      }
    } else {
      // AMap 已加载，直接初始化
      initMap();
    }

    return () => {
      // 清理地图实例，防止多次进入页面时，地图实例重复创建
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          // 忽略清理错误，避免热更新时的问题
          console.warn('Map cleanup error:', e);
        }
        mapInstanceRef.current = null;
      }
      // 清理标记，但保留数组引用以便热更新时重用
      markersRef.current.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (e) {
          // 忽略清理错误
        }
      });
      markersRef.current = [];
    };
  }, [initMap]);

  // 更新标记点
  useEffect(() => {
    if (!mapInstanceRef.current || !cities || cities.length === 0) return;

    // 清除旧标记
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 添加新标记
    cities.forEach(city => {
      if (!city.position || !city.position.lat || !city.position.lng) return;

      const marker = new window.AMap.Marker({
        position: [parseFloat(city.position.lng), parseFloat(city.position.lat)],
        title: city.cityName,
        map: mapInstanceRef.current,
      });

      // 创建信息窗口内容
      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 10px; background-color: var(--color-dark--1); color: var(--color-light--2); border-radius: 5px;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.6rem;">${city.cityName}</h3>
            <p style="margin: 0; font-size: 1.4rem;">${city.country}</p>
          </div>
        `,
        offset: new window.AMap.Pixel(0, -30),
      });

      // 点击标记跳转到城市详情
      marker.on('click', () => {
        navigate(`/app/cities/${city.id}?lat=${city.position.lat}&lng=${city.position.lng}`);
      });

      // 鼠标悬停显示信息窗口
      marker.on('mouseover', () => {
        infoWindow.open(mapInstanceRef.current, marker.getPosition());
      });

      markersRef.current.push(marker);
    });
  }, [cities, navigate, mapLoaded]);

  // 根据 state 中的坐标更新地图中心位置
  // 使用 useRef 存储上一次的坐标，避免相同坐标的重复更新
  const prevCenterRef = useRef(null);
  
  useEffect(() => {
    if (!mapInstanceRef.current || !mapCenter) return;

    const { lat, lng } = mapCenter;
    console.log('[Map] mapCenter seted to', mapCenter);

    // 检查坐标是否与上一次相同，避免重复更新
    const currentCenter = `${lat},${lng}`;
    if (prevCenterRef.current === currentCenter) return;
    
    prevCenterRef.current = currentCenter;

    // 设置地图中心并适当缩放
    mapInstanceRef.current.setCenter([lng, lat]);
    mapInstanceRef.current.setZoom(8);
  }, [mapCenter, mapLoaded]);


  useEffect(() => {
    if(localPosition) {
      setMapCenter({
        lat: localPosition.lat,
        lng: localPosition.lng,
      });
    }
  },[localPosition])

  return (
    <div className={styles.mapContainer}>
      <Button type="position" onClick={getPosition}>
        {isLoadingPosition ? 'Loading...' : '获取我的位置'}
      </Button>
      <div ref={mapRef} className={styles.map} />
      {!mapLoaded && (
        <div className={styles.mapLoading}>
          正在加载地图...
        </div>
      )}
    </div>
  );
}

export default Map;