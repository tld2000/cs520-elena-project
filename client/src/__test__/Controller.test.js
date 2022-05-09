import React from 'react'
import ReactDOM from 'react-dom'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fetchAsync, getElevation , minWeightNode, maxWeightNode, findPath, findShortestPath} from '../Controller';
import {createGrah} from '../Model';

test('fetchAsync calls', async () => {
    const startCoord = [-72.524169, 42.386647];
    const endCoord = [-72.525736, 42.388246];
    const [elements, result] = await fetchAsync(startCoord, endCoord);
    if(elements == null || result == null) return
    expect(elements && result).not.toBe(null);
}, 30000);

test('getElevation returns elevation', async () => {
    const startCoord = [-72.524169, 42.386647];
    const endCoord = [-72.525736, 42.388246];
    const [elements, result] = await fetchAsync(startCoord, endCoord);
    if(elements == null || result == null) return
    const response = await getElevation(elements);
    expect(response).not.toBe(null);
}, 30000);

test('minWeightNode returns a minimum weight node', () => {

});

test('maxWeightNode returns a maximum weight node', () => {

});

test('findShortestPath returns a path', () => {

});

test('findShortestPath returns shortest distance', () => {

});

test('findShortestPath returns elevation gain', () => {

});