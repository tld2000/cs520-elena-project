import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
// import tt from '@tomtom-international/web-sdk-maps'
import tt from '@tomtom-international/web-sdk-services';
import Graph from 'graphology';
import {DropdownButton, Dropdown} from 'react-bootstrap';
import * as turf from '@turf/turf'
mapboxgl.accessToken = 'pk.eyJ1Ijoia2F6dWhhb2thbW90byIsImEiOiJjbDF2NjhmMm8yZjY4M2Ntb3hsOGRibWtkIn0.s0CQAwqbmc-DTF7E9vkm1w';
const ttAccess = '4Q9JjW8Mo3xisGKPjp4hDZ9KPARGYeTb'
export default function App() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(2);
    const geocoder = useRef(null);
    const geocoder2 = useRef(null);
    const geocoderContainer = useRef(null);
    const geocoderContainer2 = useRef(null);
    const coord1 = useRef(null);
    const coord2 = useRef(null);
    const modeTransport = useState("car");
useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: zoom
    });
    geocoder.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        });
    geocoder2.current = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            container: geocoderContainer2,
            marker: {
                color: 'green'
            }
        });
    geocoderContainer.current.appendChild(geocoder.current.onAdd(map.current));
    geocoderContainer2.current.appendChild(geocoder2.current.onAdd(map.current));
    geocoder.current.setFlyTo(false);
    geocoder2.current.setFlyTo(false);
    
    geocoder.current.on('result', function(results) {
        coord1.current = results.result.center;
        console.log(coord1.current)
        
    })
    geocoder2.current.on('result', async function(results) {
        coord2.current = results.result.center;
        console.log(coord2.current)
        map.current.fitBounds([coord1.current,coord2.current], {padding: {top: 150, bottom:150, left: 15, right: 15}})
        console.log(map.current.getBounds());
    })

 
});


useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('move', () => {
    setLng(map.current.getCenter().lng.toFixed(4));
    setLat(map.current.getCenter().lat.toFixed(4));
    setZoom(map.current.getZoom().toFixed(2));
    });
});

function resetPaths(){
    map.current.setStyle('mapbox://styles/mapbox/streets-v11');
}

function calculateElevation(max, result){
    const coordinates = result.features[0].geometry.coordinates;
    let prev = null;
    for(let i =0; i < result.features.length; i++){
        let currentSet = result.features[i].geometry
        let currElevation = 0
        let minmaxElevation = 0
        for(let j =0; j < currentSet.coordinates.length; j ++){
            if(prev!=null) {
                let prevElevation = map.current.queryTerrainElevation(prev);
                let currElevation = map.current.queryTerrainElevation(currentSet.coordinates[i])
                let elevationDiff = currElevation - prevElevation;
                currElevation += elevationDiff;
            }
            prev = currentSet.coordinates[j];
        }
        if(max && currElevation > minmaxElevation){
            minmaxElevation = currElevation
            coordinates = result.features[i].coordinates;
        }
        if(!max && currElevation <= minmaxElevation){
            minmaxElevation = currElevation
            coordinates = result.features[i].coordinates;
        }
    }
    return coordinates;
}

async function fetchAsync (startCoord,endCoord) {
    let response = await fetch('https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way["highway"="footway"](42.37327879079956,-72.55155859124777,42.40601313381916,-72.49849306928463);out geom;');
    let data = await response.json();
    console.log(createGraph(data.elements,startCoord,endCoord))
    return data;
  }
  
function createGraph(elements,startCoord,endCoord){
    // Allow for multiple paths of different weights between two nodes
    const graph = new Graph({multi: true});

    // Keep track of nodes around the inputted start and end locations
    let possibleStart = []
    let possibleEnd = []

    //Iterate through every path way
    for(let i = 0; i < elements.length; i++){
        let currElem = elements[i];
        let prevNode = null;
        let prevNodeCoord = null;
        const allC = []
        
        // Iterate through the nodes in each path way
        for(let j = 0; j < currElem.nodes.length;j++){
            let currNode = currElem.nodes[j]
            let currCoord = [currElem.geometry[j].lon,currElem.geometry[j].lat]
            allC.push(currCoord)

            // Check if node is near the start or end coordinates 
            // If so, keep track of the NodeID to be used as start and end Node in path finding algorithm
            if(!graph.hasNode(currNode)){
                var nearStart = turf.lineString([startCoord, currCoord]);
                var lengthStart = turf.length(nearStart, {units: 'miles'}); 
                var nearEnd = turf.lineString([endCoord, currCoord]);
                var lengthEnd = turf.length(nearEnd, {units: 'miles'}); 
                if(lengthStart < 0.02){
                    possibleStart.push(currNode)
                    const marker1 = new mapboxgl.Marker()
                        .setLngLat(currCoord)
                        .addTo(map.current);
                }
                if(lengthEnd < 0.02){
                    possibleEnd.push(currNode)
                    const marker1 = new mapboxgl.Marker()
                    .setLngLat(currCoord)
                    .addTo(map.current);
                }
            }

            // If it's the first node in the path, just add it to the graph
            if(j == 0){
                prevNode = currNode
                prevNodeCoord = currCoord
                if(!graph.hasNode(currNode)){
                    graph.addNode(currNode,{coordinates: currCoord})
                }
            }

            // Every successor node draws an edge between the previous node and the current one
            else{
                let prevElevation = map.current.queryTerrainElevation(prevNodeCoord);
                let currElevation = map.current.queryTerrainElevation(currCoord)
                let elevationDiff = currElevation - prevElevation;
                if(elevationDiff < 0) elevationDiff = 0
                var line = turf.lineString([prevNodeCoord, currCoord]);
                var length = turf.length(line, {units: 'miles'}); 
                if(!graph.hasNode(currNode)){
                    graph.addNode(currNode,{coordinates: currCoord})
                }
                
                // Keep track of elevation gain, and distance between two nodes to act as weight
                // for the path finding algorithm
                graph.addEdge(prevNode,currNode,{elevationGain: elevationDiff,distance:length})
                prevNode = currNode;
                prevNodeCoord = currCoord;
            }
        }
        
    }
    console.log(possibleStart)
    console.log(possibleEnd)
}

// let findShortestPath = (graph, startNode, endNode) => {
 
//   // track distances from the start node using a hash object
//     let distances = {};
//     distances[endNode] = Infinity;
//     distances = Object.assign(distances, graph[startNode]);
//     // track paths using a hash object
//     let parents = { endNode: null };
//     for (let child in graph[startNode]) {
//       parents[child] = startNode;
//     }
 
//    // collect visited nodes
//    let visited = [];
//    // find the nearest node
//    let node = shortestDistanceNode(distances, visited);
 
//     // for that node:
//     while (node) {
//        // find its distance from the start node & its child nodes
//        let distance = distances[node];
//        let children = graph[node]; 
 
//        // for each of those child nodes:
//        for (let child in children) {
 
//           // make sure each child node is not the start node
//           if (String(child) === String(startNode)) {
//              continue;
//           } else {
//              // save the distance from start node to child node
//              let newdistance = distance + children[child];
//              // if there’s no recorded distance from the start node to the child node in the distances object
//              // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
//              if (!distances[child] || distances[child] > newdistance) {
//                 // save the distance to the object
//                 distances[child] = newdistance;
//                 // record the path
//                 parents[child] = node;
//             } 
//          }
//       } 
//     // move the current node to the visited set
//     visited.push(node);
//    // move to the nearest neighbor node
//    node = shortestDistanceNode(distances, visited);
//    }
 
//    // using the stored paths from start node to end node
//    // record the shortest path
//    let shortestPath = [endNode];
//    let parent = parents[endNode];
//    while (parent) {
//       shortestPath.push(parent);
//       parent = parents[parent];
//    }
//    shortestPath.reverse();
 
//    //this is the shortest path
// // return the shortest path & the end node’s distance from the start node
// };
async function drawRoute(coord1,coord2,maximize){
    resetPaths();
    const result = await getRoutes(coord1, coord2)
    let coordinates = result.features[0].geometry.coordinates;
    let prev = null;
    coordinates = calculateElevation(maximize,result);
    for(let i =0; i < result.features.length; i++){
        map.current.addSource(('route' + i), {
            'type': 'geojson',
            'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
            'type': 'LineString',
            'coordinates': result.features[i].geometry.coordinates
            }
            }
            });
        map.current.addLayer({
                'id': 'route' + i,
                'type': 'line',
                'source': 'route'+ i,
                'layout': {
                'line-join': 'round',
                'line-cap': 'round'
                },
                'paint': {
                'line-color': '#888',
                'line-width': 8
                }
        });
    }
    map.current.addSource('route', {
        'type': 'geojson',
        'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
        'type': 'LineString',
        'coordinates': coordinates
        }
        }
        });
    map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
            'line-join': 'round',
            'line-cap': 'round'
            },
            'paint': {
            'line-color': '#190',
            'line-width': 8
            }
    });
}
async function switchTransport(vehicle){
    modeTransport.current = vehicle;
}
async function getRoutes(coord1,coord2){
    const routeData = await tt.services.calculateRoute({
        key: ttAccess,
        locations: [coord1,coord2],
        travelMode: modeTransport.current,
        maxAlternatives: 5,
      })

    return routeData.toGeoJson();

}
return (
<div>
    <div className="sidebar">
    Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    
    <div className = "overlap">
        <div ref={mapContainer} className="map-container" />
        <div className = "input-container">
            <div ref = {geocoderContainer} className = "geocoder-container">
                <p>From</p>
            </div>
            <div ref = {geocoderContainer2} className = "geocoder-container-2">
                <p>To</p>
            </div>
            <div className = "mode-transport" onChange={event => switchTransport(event.target.value)}>
                <input type="radio" value="bicycle" name="vehicle"/> Bicycle
                <input type="radio" value="car" defaultChecked name="vehicle"/> Car
                <input type="radio" value="pedestrian" name="vehicle"/> Walk
            </div>
            <div className = "calculate">
                <button onClick={()=>fetchAsync(coord1.current,coord2.current)}>Calculate Route</button>
            </div>
        </div>

    </div>

</div>
);
}