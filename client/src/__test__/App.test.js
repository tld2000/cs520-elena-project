import React from 'react'
import ReactDOM from 'react-dom'
import App, {drawGraph} from '../App'
import '../Controller'
import '../Model'
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
mapboxgl.accessToken = 'pk.eyJ1Ijoia2F6dWhhb2thbW90byIsImEiOiJjbDF2NjhmMm8yZjY4M2Ntb3hsOGRibWtkIn0.s0CQAwqbmc-DTF7E9vkm1w';

jest.mock('mapbox-gl', () => ({
    Map: jest.fn()
}));

it('renders app without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
  });

it('renders the map correctly', () => {
    const lng = -70.9;
    const lat = 42.35;
    const zoom = 2;
    const map = new mapboxgl.Map({
        container: null,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lng, lat],
        zoom: zoom
        });
    expect(map).not.toBe(null);
});

it('renders the map box geocoder correctly', () => {
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        });
    expect(geocoder).not.toBe(null);
});

it('renders the second map box geocoder correctly', () => {
    const geocoderContainer2 = null;
    const geocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        container: geocoderContainer2,
        marker: {
            color: 'green'
        }
    });
    expect(geocoder2).not.toBe(null);
})
