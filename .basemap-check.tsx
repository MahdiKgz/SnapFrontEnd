import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useMapLibreMap } from './src/entities/map/model/use-maplibre-map';
import { BasemapPicker } from './src/features/basemap/ui/basemap-picker';
import './src/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
function Preview() {
 const {containerRef,mapRef,isMapReady}=useMapLibreMap();
 useEffect(()=>{
  const map=mapRef.current;
  if(!isMapReady||!map)return;
  window.testMap=map;
  map.addSource('test-overlay',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[51.36,35.68],[51.40,35.68],[51.40,35.72],[51.36,35.72],[51.36,35.68]]]}}});
  map.addLayer({id:'test-overlay-layer',type:'fill',source:'test-overlay',paint:{'fill-color':'#ff6600','fill-opacity':0.5}});
 },[isMapReady]);
 return <div className="relative h-dvh w-full"><div ref={containerRef} className="absolute inset-0 h-full w-full"/><BasemapPicker mapRef={mapRef} isMapReady={isMapReady}/></div>
}
createRoot(document.getElementById('root')!).render(<Preview/>);
