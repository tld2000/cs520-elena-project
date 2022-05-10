import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fetchAsync, getElevation , minWeightNode, findPath, findShortestPath} from '../Controller';
import {createGraph} from '../Model';


describe('fetchAsync', () => {
    test('fetchAsync calls', async () => {
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve({ json: () => Promise.resolve({json:function(){
              let data = require('./testJSON/overpassAPIMockResponse.json')
              return data
          }}) })
        )
        let mockResult = {
            '1':{
                '1-0':1,
                '1-1':2
            },
            '2':{'2-0':3}
        }

        const elevationMock = jest
        .spyOn(require('../Controller'), 'getElevation')
        .mockImplementation(() => Promise.resolve({
              'results' : mockResult
        }))

        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        const mockData = require('./testJSON/overpassAPIMockResponse.json');
        expect(data).toEqual[mockData.elements, mockResult];
        expect(fetchMock).toHaveBeenCalledWith(
        "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
        
        )
    })
})


describe('fetchAsync', () => {
    test('fetchAsync exception', async () => {
        const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve({ json: () => Promise.resolve({json:function(){
              let data = require('./testJSON/overpassAPIMockResponse.json')
              return data
          }}) })
        )
        let mockResult = {
            '1':{
                '1-0':1,
                '1-1':2
            },
            '2':{'2-0':3}
        }

        const elevationMock = jest
        .spyOn(require('../Controller'), 'getElevation')
        .mockImplementation(() => Promise.resolve({
              'results' : mockResult
        }))

        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        expect(data).toBe(null);
        expect(fetchMock).toHaveBeenCalledWith(
        "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
        )
    })
})

describe('getElevation', () => {
    test('getElevation returns elevation', async () => {
        const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve({ json: () => Promise.resolve({json:function(){
              let data = require('./testJSON/overpassAPIMockResponse.json')
              return data
          }}) })
        )

        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        const mockData = require('./testJSON/overpassAPIMockResponse.json');
        const elevation = await getElevation(mockData.elements);
        expect(elevation).not.toEqual(null);
        expect(elevation).toEqual(await getElevation(mockData.elements));
    })
})




/*
describe('minWeightNode', () => {
    test('minWeightNode returns min node', () => {
        const minNode = minWeightNode({}, []);
        expect(minNode).toBe(null);
    })
})


describe('findPath', () => {
    test('findPath returns a path, distance, and elevation gain', async () => {
        const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
            Promise.resolve({ json: () => Promise.resolve([]) })
        )
        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        const elements = data[0];
        const dict = data[1];
        expect(fetchMock).toHaveBeenCalledWith(
          "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
        )
        const createdGraph = createGraph(Array.isArray(elements), startCoord, endCoord, Array.isArray(dict));
        const possibleStart = createdGraph[0];
        const possibleEnd = createdGraph[1];
        const graph = createdGraph[2];
        const allCoord = createdGraph[3];
        const shortestPathData = findShortestPath(graph, possibleStart, possibleEnd, 'distance');
        const totalDistance = shortestPathData[1];
        const maxDistIncrease = totalDistance + totalDistance * (1/100);
        const pathData = findPath(graph, possibleStart, possibleEnd, maxDistIncrease, false);
        const path = pathData[0];
        const totalDist = pathData[1];
        const totalElevationGain = pathData[2];
        expect(Array.isArray(path)).not.toBe(null);
        expect(totalDist).not.toBe(null);
        expect(totalElevationGain).not.toBe(null);
    })
})

describe('findShortestPath', () => {
    test('findShortestPath returns a path, distance, and elevation gain', async () => {
        const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
            Promise.resolve({ json: () => Promise.resolve([]) })
        )
        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        const elements = data[0];
        const dict = data[1];
        expect(fetchMock).toHaveBeenCalledWith(
          "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
        )
        const createdGraph = createGraph(Array.isArray(elements), startCoord, endCoord, Array.isArray(dict));
        const possibleStart = createdGraph[0];
        const possibleEnd = createdGraph[1];
        const graph = createdGraph[2];
        const allCoord = createdGraph[3];
        const shortestPathData = findShortestPath(graph, possibleStart, possibleEnd, 'distance');
        const shortestPath = shortestPathData[0];
        const totalDistance = shortestPathData[1];
        const totalElevationGain = shortestPathData[2];
        expect(Array.isArray(shortestPath)).not.toBe(null);
        expect(totalDistance).not.toBe(null);
        expect(totalElevationGain).not.toBe(null);
    })
});*/