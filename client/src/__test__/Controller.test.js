import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fetchAsync, getElevation , minWeightNode, findPath, findShortestPath} from '../Controller';
import {createGraph} from '../Model';
//jest.mock('../Controller')


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
        const startNode = null
    })
})

describe('findShortestPath', () => {
    test('findShortestPath returns a path, distance, and elevation gain', async () => {
      const elements = require('./testJSON/createGraph/elements.json')['elements']
      const startCoord = [-72.524169, 42.386647]
      const endCoord = [-72.525736, 42.388246]
      const elemElevationDict = require('./testJSON/createGraph/elemElevationDict.json')
      const graph = createGraph(elements,startCoord,endCoord,elemElevationDict)[2]
      
      const shortest_path = require('./testJSON/findShortestPath/shortestPath.json')

      const result = findShortestPath (graph, 1439024944, 1443766378, "distance")
      expect(Array.isArray(result)).toEqual(true);
      expect(result[0]).toEqual(shortest_path)
      expect(result[1]).toEqual(0.33072559616849184)
      expect(result[2]).toEqual(7.2880401611328125)
    })
});