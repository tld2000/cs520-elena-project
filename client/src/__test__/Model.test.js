import {createGraph} from '../Model'
import {fetchAsync} from '../Controller'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import Graph from 'graphology';

import * as turf from '@turf/turf'

describe('createGraph', () => {
    test('createGraph creates a graph', async () => {
      const elements = require('./testJSON/createGraph/elements.json')['elements']
      const startCoord = [-72.524169, 42.386647]
      const endCoord = [-72.525736, 42.388246]
      const elemElevationDict = require('./testJSON/createGraph/elemElevationDict.json')
      const graph = require('./testJSON/createGraph/graph.json')
      const allC = require('./testJSON/createGraph/allC.json')['coordinates']
      const elevations = require('./testJSON/createGraph/elevations.json')

      const result = createGraph(elements,startCoord,endCoord,elemElevationDict)
      expect(Array.isArray(result)).toEqual(true);
      expect(result[0]).toEqual(1439024944)
      expect(result[1]).toEqual(1443766378)
      // expect(results[2]).toEqual(graph) // graph ids changes every run
      expect(result[3]).toEqual(allC)
      expect(result[4]).toEqual(elevations)
      expect(result[5]).toEqual(87.43270111083984)
      expect(result[6]).toEqual(64.95115661621094)
    })
  })