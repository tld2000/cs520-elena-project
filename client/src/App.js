import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
// import tt from '@tomtom-international/web-sdk-maps'
import tt from '@tomtom-international/web-sdk-services' 

mapboxgl.accessToken = 'pk.eyJ1Ijoia2F6dWhhb2thbW90byIsImEiOiJjbDF2NjhmMm8yZjY4M2Ntb3hsOGRibWtkIn0.s0CQAwqbmc-DTF7E9vkm1w';
const ttAccess = '4Q9JjW8Mo3xisGKPjp4hDZ9KPARGYeTb'
export default function App() {
const mapContainer = useRef(null);
const map = useRef(null);
const [lng, setLng] = useState(-70.9);
const [lat, setLat] = useState(42.35);
const [zoom, setZoom] = useState(2);
const geocoder = useRef(null);
const geocoder2 = useRef(null);
const geocoderContainer = useRef(null);
const geocoderContainer2 = useRef(null);
let coord1 = [-70.9,42.35]
let coord2 = [-70.9,42.35]
useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: zoom
    });
    geocoder.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        });
    geocoder2.current = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            container: geocoderContainer2,
            marker: {
                color: 'green'
            }
        });
    geocoderContainer.current.appendChild(geocoder.current.onAdd(map.current));
    geocoderContainer2.current.appendChild(geocoder2.current.onAdd(map.current));
    geocoder.current.setFlyTo(false);
    geocoder2.current.setFlyTo(false);
    
    geocoder.current.on('result', function(results) {
        coord1.current = results.result.center;
        
        
    })
    geocoder2.current.on('result', async function(results) {
        coord2.current = results.result.center;
        map.current.fitBounds([coord1.current,coord2.current], {padding: {top: 150, bottom:150, left: 15, right: 15}})
        const result = await getRoutes(coord1.current, coord2.current)
        const coordinates = result.features[0].geometry.coordinates;
        map.current.addSource('route', {
            'type': 'geojson',
            'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
            }
            }
            });
        map.current.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                'line-join': 'round',
                'line-cap': 'round'
                },
                'paint': {
                'line-color': '#888',
                'line-width': 8
                }
        });

    })
});

useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('move', () => {
    setLng(map.current.getCenter().lng.toFixed(4));
    setLat(map.current.getCenter().lat.toFixed(4));
    setZoom(map.current.getZoom().toFixed(2));
    });
});

async function getRoutes(coord1,coord2){
    const routeData = await tt.services.calculateRoute({
        key: ttAccess,
        locations: [coord1,coord2],
        maxAlternatives: 0,
      })
      return routeData.toGeoJson();
}
return (
<div>
    <div className="sidebar">
    Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    
    <div className = "overlap">
        <div ref={mapContainer} className="map-container" />
        <div className = "input-container">
            <div ref = {geocoderContainer} className = "geocoder-container">
                <p>From</p>
            </div>
            <div ref = {geocoderContainer2} className = "geocoder-container-2">
                <p>To</p>
            </div>
        </div>

    </div>

</div>
);
}