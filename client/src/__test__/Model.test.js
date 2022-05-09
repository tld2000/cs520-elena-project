import {createGraph} from '../Model'
import {fetchAsync} from '../Controller'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import Graph from 'graphology';

import * as turf from '@turf/turf'

describe('createGraph', () => {
    test('createGraph creates a graph', async () => {
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
      expect(Array.isArray(elements)).not.toBe(null);
      expect(Array.isArray(dict)).not.toBe(null);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way[\"highway\"=\"footway\"](42.383647,-72.527169,42.391246,-72.522736);out geom;"
      )
      const createdGraph = createGraph(Array.isArray(elements), startCoord, endCoord, Array.isArray(dict));
      const possibleStart = createdGraph[0];
      const possibleEnd = createdGraph[1];
      const graph = createdGraph[2];
      const allCoord = createdGraph[3];
      expect(Array.isArray(possibleStart)).not.toBe(null);
      expect(Array.isArray(possibleEnd)).not.toBe(null);
      expect(graph).not.toBe(null);
      expect(allCoord).not.toBe(null);
    })
  })