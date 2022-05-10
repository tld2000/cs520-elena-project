import React, { useRef, useEffect, useState } from 'react';

import mapboxgl from 'mapbox-gl'; //eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { BsGeoAlt,BsFillGeoAltFill,BsBicycle } from "react-icons/bs";
import { MdDirectionsWalk } from "react-icons/md";

import Graph from 'graphology';
import {ToggleButtonGroup, ToggleButton,Button,Slider,Switch,FormControlLabel} from '@mui/material'
import { createGraph } from './Model';
import {fetchAsync, findShortestPath,findPath} from './Controller'
import logo from './EleNaIcon.png';
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
    

    const modeTransport = useRef(null);
    const currentMarkers = useRef(null)
    const boolMax = useRef(null)
    const [shortestDist,setShortest]= useState(0)
    const [totalDist,setDist] = useState(0)
    const [totalElevationGain,setElev] = useState(0)
    const [alignment, setAlignment] = useState('["highway"="footway"]');
    const [elevationAlignment, setElevationAlignment] = useState('min');
    const [percent, percentIncrease] = useState('0')
    const [seeElevation, setElevationShow] = useState(false);

    const handleChange = (
      event,
      newAlignment,
    ) => {
      setAlignment(newAlignment);
      switchTransport(newAlignment)
      
    };
    const handleElevationChange = (
        event,
        newAlignment,
      ) => {
        setElevationAlignment(newAlignment);
        if(newAlignment === "max"){
            boolMax.current = true;
        }
        else{
            boolMax.current = false;
        }
      };
    const setPercentIncrease = (event,newPercent)=>{
        percentIncrease(newPercent)
    }
    const elevationSwitch = (event)=>{
        setElevationShow(!seeElevation)
        console.log(seeElevation)
    }

useEffect(() => {
    if (map.current) return; // initialize map only once

    modeTransport.current = '["highway"="footway"]'
    boolMax.current = 'false'
    currentMarkers.current = []
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
        // console.log(coord1.current)
        
    })
    geocoder2.current.on('result', async function(results) {
        coord2.current = results.result.center;
        // console.log(coord2.current)
        map.current.fitBounds([coord1.current,coord2.current], {padding: {top: 150, bottom:150, left: 15, right: 15}})
        // console.log(map.current.getBounds());
        
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

/**
 * Reset map to remove all drawn paths and markers
 */
function resetPaths(){
    map.current.setStyle('mapbox://styles/mapbox/streets-v11');
    if (currentMarkers.current!==null) {
        for (var i = currentMarkers.current.length - 1; i >= 0; i--) {
          currentMarkers.current[i].remove();
        }
    }
}

/**
 * Given a start and end coordinate, this function finds and draws the path 
 * @param  {Number} startCoord - The start location coordinate
 * @param  {Number} endCoord - The end location coordinate
 */
async function drawGraph(startCoord,endCoord){
 
    // Remove all current markings
    resetPaths();
    
    // Fetch data 
    let [elements, elemElevationDict] = await fetchAsync(startCoord,endCoord)
    
    
    if(elements == null || elemElevationDict == null) return

    // console.log(elemElevationDict)


    // Create data model
    const [possibleStart,possibleEnd,graph, allC,elevations,maxElevation,minElevation] = createGraph(elements,startCoord,endCoord,elemElevationDict);
    console.log(seeElevation)
    if(seeElevation){
        for(let elev in elevations){
            map.current.addSource("polygon" + elev, createGeoJSONCircle(graph.getNodeAttributes(elev)["coordinates"], 0.03));
            let normalized = (elevations[elev] - minElevation )/ (maxElevation - minElevation)

            // the more red = the higher the elevation
            map.current.addLayer({
                "id": "polygon" + elev,
                "type": "fill",
                "source": "polygon" + elev,
                "layout": {},
                "paint": {
                    "fill-color": `rgba(${normalized*256},${256 - normalized * 150}, ${256 - normalized * 256},0.8)`,
                    "fill-opacity": 0.6
                }
            });
    
        }
    }

    
    let path;

    //Finding paths
    try{
        let [shortPath,totalDistance,totalElevationGain] = findShortestPath(graph,possibleStart,possibleEnd,"distance")
        path = shortPath;
        console.log(percent)
        // set shortest path value to total distance of the shortest path
        setShortest(totalDistance)
        let maxDistIncrease = totalDistance + totalDistance * (percent / 100)
        if(maxDistIncrease == totalDistance){

            // set actual distance to the shortest path, if max increase is 0 %
            setDist(totalDistance)
            setElev(totalElevationGain)
        }
        else if(boolMax.current == true){
            let [maxPath,totDis,totEl]= findPath(graph,possibleStart,possibleEnd,maxDistIncrease,true)
            path = maxPath
            setDist(totDis)
            setElev(totEl)
            // drawRoute(graph,maxPath)
        }
        else{
            let [minPath,totDis,totEl] = findPath(graph,possibleStart,possibleEnd,maxDistIncrease,false)
            path = minPath
            // set actual distance and elevation to the new distance
            setDist(totDis)
            setElev(totEl)
        }
        
     }catch(err){
         console.log(err)
         console.log("no route found")
     }

    //Draw out all possible paths in gray using mapbox API
    console.log(allC)
    for(let i =0; i < allC.length;i++){
        map.current.addSource('route' + i , {
            'type': 'geojson',
            'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
            'type': 'LineString',
            'coordinates': allC[i]
            }
            }
            });
        map.current.addLayer({
                'id': 'route' + i,
                'type': 'line',
                'source': 'route' +i,
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

    // console.log(path)


    // Draw out final route in green
    drawRoute(graph,path); 
    // console.log(graph)

    //Markers for closest starting location node
    const marker1 = new mapboxgl.Marker()
    .setLngLat(graph.getNodeAttributes(possibleStart)["coordinates"])
    .addTo(map.current);
    const marker2 = new mapboxgl.Marker()

    //Marker for closest ending location node
    .setLngLat(graph.getNodeAttributes(possibleEnd)["coordinates"])
    .addTo(map.current);
    currentMarkers.current.push(marker1)
    currentMarkers.current.push(marker2)

}

/**
 * Draw a route given an array of node IDs
 * @param  {Graph} graph The full path graph
 * @param  {Array.<Number>} nodeIds - The array of nodeIDs that make up the path
 */
async function drawRoute(graph, nodeIds){
    if(graph == undefined || nodeIds == undefined){
        return;
    }
    let allCoords = []
    // console.log(nodeIds)
    for(let i = 0; i < nodeIds.length;i++){
        // console.log(nodeIds[i])
        if(graph.hasNode(nodeIds[i])){
            allCoords.push(graph.getNodeAttributes(nodeIds[i])["coordinates"]);
        }
    }
    console.log(allCoords)
    map.current.addSource('green', {
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
            'id': 'green',
            'type': 'line',
            'source': 'green',
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

var createGeoJSONCircle = function(center, radiusInKm, points) {
    // console.log(center)
    if(!points) points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    var distanceY = km/110.574;

    var theta, x, y;
    for(var i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ret]
                }
            }]
        }
    };
};

/**
 * Switch the type of transport used in the route 
 * @param  {String} vehicle Value for query string to switch mode of transport, to be passed into Overpass API 
 */
async function switchTransport(vehicle){
    modeTransport.current = vehicle;
    console.log(modeTransport.current)
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
                <p>Percent Increase</p>
                <Slider
                    aria-label="Temperature"
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    step={10}
                    marks={true}
                    min={0}
                    max={100}
                    onChange={setPercentIncrease}
                />
            </div>
            </div>
            <div className ="switch">
                <FormControlLabel control={<Switch onChange={elevationSwitch}/>} label="See Elevation Gain" />
            </div>
            <div className = "calculate">
                
                <Button variant="contained" size = "large" onClick={async ()=>await drawGraph(coord1.current,coord2.current)}>Calculate Route</Button>
                <div className = "data">
                <header className = "data-header">Data in miles:</header>
                    <p className = "data-header">Shortest Distance: {shortestDist}</p>
                    <p className = "data-header">Total Distance: {totalDist}</p>
                    <p className = "data-header">Total Elevation Gain: {totalElevationGain}</p>
                </div>
            </div>
            <div className = "logo">
                <img src={logo} width="250" height="150" />
            </div>
        </div>

    </div>

</div>
);
}