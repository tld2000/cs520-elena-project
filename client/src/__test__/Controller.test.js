import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fetchAsync, getElevation , minWeightNode, maxWeightNode, findPath, findShortestPath} from '../Controller';
import {createGraph} from '../Model';


describe('fetchAsync', () => {
    test('fetchAsync calls', async () => {
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve({ json: () => Promise.resolve([]) })
        )
      const startCoord = [-72.524169, 42.386647];
      const endCoord = [-72.525736, 42.388246];
      const data = await fetchAsync(startCoord, endCoord);
      expect(Array.isArray(data)).toEqual(true);

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
          Promise.reject("API is down")
        )
      const startCoord = [-72.524169, 42.386647];
      const endCoord = [-72.525736, 42.388246];
      const data = await fetchAsync(startCoord, endCoord);
      const elements = data[0];
      const dict = data[1];
      expect(fetchMock).toHaveBeenCalledWith(
        "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
      )
      expect(elements).toBe(null);
      expect(dict).toBe(null);
    })
  })

describe('getElevation', () => {
    test('getElevation returns elevation', async () => {
        const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
            Promise.resolve({ json: () => Promise.resolve([]) })
        )
        const startCoord = [-72.524169, 42.386647];
        const endCoord = [-72.525736, 42.388246];
        const data = await fetchAsync(startCoord, endCoord);
        const elements = data[0];
        expect(fetchMock).toHaveBeenCalledWith(
          "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
        )
        const elevation = await getElevation(Array.isArray(elements));
        expect(Array.isArray(elevation)).not.toBe(null);
    })
})

describe('minWeightNode', () => {
    test('minWeightNode returns min node', () => {
        const minNode = minWeightNode({}, []);
        expect(minNode).toBe(null);
    })
})

describe('maxWeightNode', () => {
    test('maxWeightNode returns max node', () => {
        const maxNode = maxWeightNode({}, []);
        expect(maxNode).toBe(null);
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
});