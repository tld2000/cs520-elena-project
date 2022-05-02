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
    console.log("data body")
    console.log(data.elements)
    console.log(createGraph(data.elements,startCoord,endCoord))
    return data;
  }
  
function createGraph(elements,startCoord,endCoord){
    // Allow for multiple paths of different weights between two nodes
    const graph = new Graph();

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
                console.log("length start " + lengthStart)
                var nearEnd = turf.lineString([endCoord, currCoord]);
                var lengthEnd = turf.length(nearEnd, {units: 'miles'}); 
                if(lengthStart < 0.005){
                    possibleStart.push(currNode)
                    const marker1 = new mapboxgl.Marker()
                        .setLngLat(currCoord)
                        .addTo(map.current);
                }
                if(lengthEnd < 0.005){
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
                if(length < 0.001){
                    continue
                }
                if(!graph.hasNode(currNode)){
                    graph.addNode(currNode,{coordinates: currCoord})
                }
                if(!graph.hasEdge(prevNode,currNode)){
                    // Keep track of elevation gain, and distance between two nodes to act as weight
                    // for the path finding algorithm
                    graph.addUndirectedEdge(prevNode,currNode,{elevationGain: elevationDiff,distance:length})
                }
                prevNode = currNode;
                prevNodeCoord = currCoord;
            }
        }
        
    }
    console.log("possible start-end")
    console.log(possibleStart)
    console.log(possibleEnd)
    let shortestPath = findShortestPath(graph,possibleStart[0],possibleEnd[0])
    drawRoute(graph,shortestPath)
}

function minWeightNode (weights, visited){
      let shortest = null;
      for (let node in weights) {
          let currShortest = shortest === null || weights[node] < weights[shortest];
          if (currShortest && !visited.includes(node)) {
              shortest = node;
          }
      }
      return shortest;
  };

function findShortestPath (graph, startNode, endNode) {
    let startCoord = graph.getNodeAttribute(startNode)["coordinates"]
    let endCoord = graph.getNodeAttributes(endNode)["coordinates"]
    console.log(startCoord)
    console.log(endCoord)
    let minLine= turf.lineString([startCoord, endCoord]);
    let minDistance = turf.length(minLine, {units: 'miles'}); 
    let weights = {};
    weights[endNode] = Infinity;
    let parents = { endNode: null };
    for(let i = 0; i < graph.neighbors(startNode).length; i++){
        let child = graph.neighbors(startNode)[i]
        weights[child] = graph.getUndirectedEdgeAttributes(startNode, child)["distance"];
        parents[child] = startNode;
    }

    let visited = [];
    let node = minWeightNode(weights, visited);
 
    while (node) {
       let weight = weights[node];
       let children = graph.neighbors(node); 
 
       for(let i = 0; i < graph.neighbors(node).length; i++){
          let child = graph.neighbors(node)[i]
          if (String(child) === String(startNode)) {
             continue;
          } else {
             let newdistance = weight + graph.getUndirectedEdgeAttributes(node, child)["distance"];
             if(newdistance > minDistance + 0.05){
                continue;
             } 
             if (!weights[child] || weights[child] >= newdistance) {
                weights[child] = newdistance;
                parents[child] = node;
            } 
         }
      } 
    visited.push(node);
   node = minWeightNode(weights, visited);
   }
 
   let shortestPath = [endNode];
   let parent = parents[endNode];
   while (parent) {
      shortestPath.push(parent);
      parent = parents[parent];
   }
   shortestPath.reverse();
   return shortestPath;

};

async function drawRoute(graph, nodeIds){
    let allCoords = []
    for(let i = 0; i < nodeIds.length;i++){
        allCoords.push(graph.getNodeAttribute(nodeIds[i],"coordinates"));
    }
        map.current.addSource('route', {
        'type': 'geojson',
        'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
        'type': 'LineString',
        'coordinates': allCoords
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