import React from 'react'
import ReactDOM from 'react-dom'
import {render, waitFor } from "@testing-library/react"
import App from '../App'
// import {createGraph} from '../App'
import {createGraph} from '../Controller'

jest.mock('mapbox-gl', () => ({
    Map: jest.fn()
}));

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
  });

test('createGraph generates a graph', () => {
    const dict = {};
    dict['1'] = [42.3864, -72.5247];
    dict['2'] = [42.3877, -72.5245];
    dict['3'] = [42.3870, -72.5240];
    dict['4'] = [42.3881, -72.5257];
    dict['5'] = [42.3884, -72.5267];

    const graph = createGraph([[42.3877, -72.5245], [42.3870, -72.5240], [42.3881, -72.5257]],
        [42.3864, -72.5247], [42.3884, -72.5267], dict)
    
    expect(graph).toContain([42.3877, -72.5245]);
})

