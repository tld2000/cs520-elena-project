import React from 'react'
import ReactDOM from 'react-dom'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '../App'
import '../Controller'
import '../Model'

test('getElevation returns elevations', () => {
    const startCoord = [-72.524169, 42.386647];
    const endCoord = [-72.525736, 42.388246];
    const [elements, result] = fetchAsync(startCoord, endCoord);
    const elevation = getElevation(elements);
    expect(elevation).toContain({9058173: {66684861: 67.69210052490234, 1443766378: 66.4633560180664}});
});

