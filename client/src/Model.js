import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import Graph from 'graphology';

import * as turf from '@turf/turf'

/**
 * Create a Graph with elements, coordinates, and elevations.
 * @param {Graph} graph - The full path graph
 * @param {Any} startCoord - The start location coordinate
 * @param {Any} endNode - The end location coordinate
 * @param {Any} elemElevationDict - Dictionary containing elevations of elements
 * @return {Array: [Any, Any, {Graph}, Array[][][]]} [possibleStart,possibleEnd,graph,allCoord] -
 * [A possible start to the graph,
 * A possible end to the graph,
 * full path graph created with elements, coordinates, and elevations,
 * all coordinates in the graph]
 */
export function createGraph(elements,startCoord,endCoord,elemElevationDict){
    // Allow for multiple paths of different weights between two nodes

    const graph = new Graph();

    // Keep track of nodes around the inputted start and end locations
    let possibleStart = undefined
    let minDistanceToStart = Number.MAX_VALUE
    let possibleEnd = undefined
    let minDistanceToEnd = Number.MAX_VALUE
    let longestPathSoFarStart = 0;
    let longestPathSoFarEnd = 0;
    let elevations = {};
    const allCoord = []
    let maxElevation = 0
    let minElevation = 100000
    //Iterate through every path way
    for(let i = 0; i < elements.length; i++){
        let currElem = elements[i];
        let prevNode = null;
        let prevNodeCoord = null;
        let allC=[]
        
        // Iterate through the nodes in each path way
        for(let j = 0; j < currElem.nodes.length;j++){
            let currNode = currElem.nodes[j]
            let currCoord = [currElem.geometry[j].lon,currElem.geometry[j].lat]
            allC.push(currCoord)
            
            // track start-end pos
            var lengthStart = turf.length(turf.lineString([startCoord, currCoord]), {units: 'miles'});
            var lengthEnd = turf.length(turf.lineString([endCoord, currCoord]), {units: 'miles'});
            if(lengthStart < 0.03 && currElem.nodes.length > longestPathSoFarStart){
                longestPathSoFarStart = currElem.nodes.length
                possibleStart = currNode;
                minDistanceToStart = lengthStart;
            }
            if(lengthEnd < 0.03 && currElem.nodes.length > longestPathSoFarEnd){
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
                if(elevationDiff < 0) elevationDiff = 0
                else{
                    if(currElevation > maxElevation) maxElevation = currElevation
                    if(currElevation < minElevation) minElevation = currElevation
                    elevations[currNode] = currElevation
                }
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
        allCoord.push(allC)
    }
    return [possibleStart,possibleEnd,graph,allCoord,elevations,maxElevation,minElevation]

}