import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fetchAsync, getElevation , minWeightNode, findPath, findShortestPath} from '../Controller';
import {createGraph} from '../Model';
//jest.mock('../Controller')


describe('fetchAsync', () => {
    test('fetchAsync calls', async () => {
      const fetchMock = jest
<<<<<<< HEAD
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
=======
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({async json() {console.log('aaa'); return require('./testJSON/overpassAPIMockResponse.json')}
           })
        )

      let mockResult = {
        '1':{
          '1-0':1,
          '1-1':2
        },
        '2':{'2-0':3}
      }
      
      getElevation = jest.fn().mockReturnValue(Promise.resolve({
          'results':mockResult
        }) )
        
      const startCoord = [-72.524169, 42.386647];
      const endCoord = [-72.525736, 42.388246];
      const data = await fetchAsync(startCoord, endCoord);
      const mockData = require('./testJSON/overpassAPIMockResponse.json')
      //console.log(data)
      expect(Array.isArray(data)).toEqual(true);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
      )
      expect(data).toEqual([mockData.elements, mockResult])
>>>>>>> 4e6707008d9e33e45bca218aefa081443fe045e5
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
      let weights = {node1:10,
                    node2:20,
                  node3:30,
                node4:5}
      let visited = ['node4']
      const minNode = minWeightNode(weights, visited);
      expect(minNode).toEqual('node1');
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
      const graph = new Graph();
    })
});*/