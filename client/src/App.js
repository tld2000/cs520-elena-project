import React, { useRef, useEffect, useState } from 'react';

import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { BsGeoAlt,BsFillGeoAltFill,BsBicycle } from "react-icons/bs";
import { MdDirectionsWalk } from "react-icons/md";

import Graph from 'graphology';
import {ToggleButtonGroup, ToggleButton,Button,Slider} from '@mui/material'
import * as turf from '@turf/turf'

mapboxgl.accessToken = 'pk.eyJ1Ijoia2F6dWhhb2thbW90byIsImEiOiJjbDF2NjhmMm8yZjY4M2Ntb3hsOGRibWtkIn0.s0CQAwqbmc-DTF7E9vkm1w';




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
    const allMarkers = useRef(null);
    const modeTransport = useState('["highway"="footway"]');
    modeTransport.current = '["highway"="footway"]'
    
    const [alignment, setAlignment] = React.useState('["highway"="footway"]');
    const [elevationAlignment, setElevationAlignment] = React.useState('min');
    const handleChange = (
      event,
      newAlignment,
    ) => {
      setAlignment(newAlignment);
      switchTransport(event.target.value)
    };
    const handleElevationChange = (
        event,
        newAlignment,
      ) => {
        setElevationAlignment(newAlignment);
        switchTransport(event.target.value)
      };
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


async function fetchAsync (startCoord,endCoord) {
    resetPaths();
    console.log('start-end')
    console.log(startCoord);
    console.log(endCoord);
    let query = undefined;
    let bounds = map.current.getBounds()
    console.log(modeTransport.current)
    query = `https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way`+`${modeTransport.current}`+`(${bounds._sw.lat},${bounds._sw.lng},${bounds._ne.lat},${bounds._ne.lng});out geom;`
    let response = await fetch(query);
    let data = await response.json();
    let x = await getElevation(data.elements,startCoord,endCoord)
    console.log("X " + x)
    return data;
  }


async function getElevation(elements,startCoord,endCoord){
    // query elevation for all nodes
    var elemDict = {}
    for(let i = 0; i < elements.length; i++){
        let currElement = elements[i]
        elemDict[currElement['id']] = {}
        for(let j = 0; j < currElement.nodes.length;j++){
            elemDict[currElement['id']][currElement.nodes[j]] = [currElement.geometry[j].lon,currElement.geometry[j].lat]
        }
    }
    let jsonElem = JSON.stringify(elemDict)
    let response = await fetch('http://localhost:5000/elevation', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonElem
      }).then(async function(result){ 
          let temp = result.json()
          console.log(temp)
          return temp
        }).then(result => createGraph(elements, startCoord, endCoord, result['results']))
}

  
function createGraph(elements,startCoord,endCoord,elemElevationDict){
    
    // Allow for multiple paths of different weights between two nodes
    const graph = new Graph();
    console.log(elemElevationDict)

    // Keep track of nodes around the inputted start and end locations
    let possibleStart = undefined
    let minDistanceToStart = Number.MAX_VALUE
    let possibleEnd = undefined
    let minDistanceToEnd = Number.MAX_VALUE
    let longestPathSoFarStart = 0;
    let longestPathSoFarEnd = 0;
    let z= null;
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
            
            // track start-end pos
            var lengthStart = turf.length(turf.lineString([startCoord, currCoord]), {units: 'miles'});
            var lengthEnd = turf.length(turf.lineString([endCoord, currCoord]), {units: 'miles'});
            if(lengthStart < 0.05 && currElem.nodes.length > longestPathSoFarStart){
                longestPathSoFarStart = currElem.nodes.length
                possibleStart = currNode;
                minDistanceToStart = lengthStart;
            }
            if(lengthEnd < 0.05 && currElem.nodes.length > longestPathSoFarEnd){
                longestPathSoFarEnd = currElem.nodes.length
                possibleEnd = currNode;
                minDistanceToEnd = lengthEnd;
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
                // let prevElevation = map.current.queryTerrainElevation(prevNodeCoord);
                let prevElevation = elemElevationDict[currElem['id']][prevNode];
                // let currElevation = map.current.queryTerrainElevation(currCoord)
                let currElevation = elemElevationDict[currElem['id']][currNode];

                let elevationDiff = currElevation - prevElevation;
                // console.log('elediff' + elevationDiff)
                if(elevationDiff < 0) elevationDiff = 0
                var line = turf.lineString([prevNodeCoord, currCoord]);
                var length = turf.length(line, {units: 'miles'}); 
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
        map.current.addSource('route'+i  , {
            'type': 'geojson',
            'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
            'type': 'LineString',
            'coordinates': allC
            }
            }
            });
        map.current.addLayer({
                'id': 'route'+i,
                'type': 'line',
                'source': 'route'+i,
                'layout': {
                'line-join': 'round',
                'line-cap': 'round'
                },
                'paint': {
                'line-color': '#999',
                'line-width': 8
                }
        });
    }
    console.log(z)
    const marker1 = new mapboxgl.Marker()
    .setLngLat(graph.getNodeAttributes(possibleStart)["coordinates"])
    .addTo(map.current);
    const marker2 = new mapboxgl.Marker()
    .setLngLat(graph.getNodeAttributes(possibleEnd)["coordinates"])
    .addTo(map.current);
    let shortestPath = findShortestPath(graph,possibleStart,possibleEnd)
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
    let startCoord = graph.getNodeAttributes(startNode)["coordinates"]
    let endCoord = graph.getNodeAttributes(endNode)["coordinates"]
    console.log(startCoord)
    console.log(endCoord)
    let minLine= turf.lineString([startCoord, endCoord]);
    let minDistance = turf.length(minLine, {units: 'miles'}); 
    let weights = {};
    weights[endNode] = Infinity;
    let parents = {};
    parents[endNode] = null;
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
            //  let newdistance = weight + graph.getUndirectedEdgeAttributes(node, child)["distance"];
             let a = Math.pow(graph.getUndirectedEdgeAttributes(node, child)["elevationGain"],2);
             let b = Math.pow(graph.getUndirectedEdgeAttributes(node, child)["distance"],2)
             let newDistance = weight + graph.getUndirectedEdgeAttributes(node, child)["distance"]
             if (!weights[child] || weights[child] >= newDistance) {
                weights[child] = newDistance;
                parents[child] = node;
            } 
         }
      } 
    visited.push(node);
    node = minWeightNode(weights, visited);
   }
   console.log("start node " + startNode)
   console.log("end node" + endNode)
   console.log("parents " + JSON.stringify(parents, null, 4))
   let totalElevationGain = 0
   let shortestPath = [endNode];
   let parent = parents[endNode];
   while (parent) {
      shortestPath.push(parent);
      if(parents[parent]){
        totalElevationGain += graph.getUndirectedEdgeAttributes(parent,parents[parent])["elevationGain"]
      }
      parent = parents[parent];
   }
   console.log(shortestPath);
   console.log("total elevation gain " + totalElevationGain)
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

return (
<div>
    <div className="sidebar">
    Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    
    <div className = "overlap">
        <div ref={mapContainer} className="map-container" />
        <div className = "input-container">
            <div ref = {geocoderContainer} className = "geocoder-container">
                <div className = "icon">
                    <BsGeoAlt size={30} />
                </div>   
            </div>
            <div ref = {geocoderContainer2} className = "geocoder-container-2">
                <div className = "icon">
                    <BsFillGeoAltFill color={"#757ce8"} size={30}/>
                </div> 
            </div>
            <div className = "mode-transport">
                <div className = "elevation-mode">
                    <ToggleButtonGroup
                        value={elevationAlignment}
                        exclusive
                        onChange={handleElevationChange}
                        size="large"
                        color="primary"
                    >
                        <ToggleButton value='min'>Min</ToggleButton>
                        <ToggleButton value='max' >Max</ToggleButton>
                    </ToggleButtonGroup>
                </div>
                <div className = "vehicle">
                    <ToggleButtonGroup
                        value={alignment}
                        exclusive
                        onChange={handleChange}
                        color="primary"
                        size="large"
                    >
                        <ToggleButton value='["highway"="footway"]' ><MdDirectionsWalk size={28}/></ToggleButton>
                        <ToggleButton value='["highway"]["bicycle"="yes"]'><BsBicycle size={28}/></ToggleButton>    
                    </ToggleButtonGroup>
                </div>
            <div className = "slider">
                <Slider
                    aria-label="Temperature"
                    defaultValue={30}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={10}
                    max={110}
                />
            </div>
            </div>
            <div className = "calculate">
                <Button variant="contained" size = "large" onClick={()=>fetchAsync(coord1.current,coord2.current)}>Calculate Route</Button>
            </div>
        </div>

    </div>

</div>
);
}