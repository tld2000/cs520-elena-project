import React from 'react'
import ReactDOM from 'react-dom'
import {createGraph} from '../Model'
import {fetchAsync} from '../Controller'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import Graph from 'graphology';

import * as turf from '@turf/turf'

test('createGraph creates a graph', async () => {
    const startCoord = [-72.524169, 42.386647];
    const endCoord = [-72.525736, 42.388246];
    const [elements, result] = await fetchAsync(startCoord, endCoord);
    if(elements == null || result == null) return
    const [possibleStart,possibleEnd,graph,allCoord] = createGraph(elements, startCoord, endCoord, result);
    if(possibleStart == null || possibleEnd == null || graph == null || allCoord == null) return
    expect(possibleStart && possibleEnd && graph && allCoord).not.toBe(null);
}, 30000);