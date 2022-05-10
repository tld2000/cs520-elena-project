import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import Graph from 'graphology';
export async function fetchAsync (startCoord,endCoord) {

    let query = undefined;

    //console.log(startCoord,endCoord)
    // Allow some leeway around coordinates to make path
    if(startCoord[1] < endCoord[1]){
        let minCoord = [
            startCoord[0]-0.003,startCoord[1]-0.003]
        let maxCoord = [endCoord[0]+0.003,endCoord[1]+0.003]
        query = `https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way["highway"="footway"](${minCoord[1]},${minCoord[0]},${maxCoord[1]},${maxCoord[0]});out geom;`
    } else {
        let minCoord = [endCoord[0]-0.003,endCoord[1]-0.003]
        let maxCoord = [startCoord[0]+0.003,startCoord[1]+0.003]
        query = `https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way["highway"="footway"](${minCoord[1]},${minCoord[0]},${maxCoord[1]},${maxCoord[0]});out geom;`
    }
    // query = `https://www.overpass-api.de/api/interpreter?data=[out:json][timeout:60];way`+`${modeTransport.current}`+`(${bounds._sw.lat},${bounds._sw.lng},${bounds._ne.lat},${bounds._ne.lng});out geom;`
    let response = await fetch(query);
    let data = await response.json();
    //console.log(response.json())
    let result = await getElevation(data.elements,startCoord,endCoord)
    console.log('data')
    console.log(data)
    return [data.elements,result];
  }

export async function getElevation(elements){
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
        //   console.log(temp)
          return temp
        }).then((result) => {
            // console.log(result)
            return result['results']
        })
    return response
}

export function minWeightNode (weights, visited){
     
      let shortest = null;
      for (let node in weights) {
          let currShortest = shortest === null || weights[node] < weights[shortest];
          if (currShortest && !visited.includes(node)) {
              shortest = node;
          }
          console.log(shortest)
      }
      return shortest;
  };


export function findPath(graph, startNode, endNode,maxIncrease,maximize){
    let minPath = null;
    let minElevationGain = Infinity;
    let maxElevationGain = 0
    let minDistance = Infinity;
    const newGraph = graph.copy()
    for(let i = 0;i < 10; i++){
        let [newPath,totalDistance,totalElevationGain] = findShortestPath(newGraph, startNode,endNode,'distance')
         if(newPath == null || newPath.length == 0) break;
         if(totalDistance <= maxIncrease) {
             if(!maximize && totalElevationGain <= minElevationGain){
                minDistance = totalDistance
                minElevationGain = totalElevationGain
                minPath = newPath
             }
             if(maximize && totalElevationGain >= maxElevationGain){
                minDistance = totalDistance
                minElevationGain = totalElevationGain
                minPath = newPath
             }
         }     
         let min = 0
         let minEdge =null
         for(let j = 2; j < newPath.length -3; j+=1){
             let dist = newGraph.neighbors(newPath[j]).length
             if(dist > min){
                 minEdge = [newPath[j],newPath[j+1]]
                 min = dist
             }
         }
         newGraph.dropEdge(minEdge[0],minEdge[1])
    }
    return [minPath,minDistance,minElevationGain];
}

export function findShortestPath (graph, startNode, endNode,attribute) {
   
    attribute = typeof attribute !== 'undefined' ? attribute : 'distance';

    let weights = {};
    weights[endNode] = Infinity;
    let parents = {};
    parents[endNode] = null;
    for(let i = 0; i < graph.neighbors(startNode).length; i++){
        let child = graph.neighbors(startNode)[i]
        weights[child] = graph.getUndirectedEdgeAttributes(startNode, child)[attribute];
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
             let value = graph.getUndirectedEdgeAttributes(node, child)[attribute]
             value = value !== 0 ? value : 0.0001;
             let newDistance = weight + graph.getUndirectedEdgeAttributes(node, child)[attribute];
             if (!weights[child] || weights[child] >= newDistance) {
                weights[child] = newDistance;
                parents[child] = node;
            } 
         }
      } 
    visited.push(node);
    node = minWeightNode(weights, visited);
   }
//    console.log("start node " + startNode)
//    console.log("end node" + endNode)
//    console.log("parents " + JSON.stringify(parents, null, 4))
   let totalElevationGain = 0
   let totalDistance = 0
   let shortestPath = [endNode];
   let parent = parents[endNode];
   while (parent) {
      shortestPath.push(parent);
      if(parents[parent]){
        totalElevationGain += graph.getUndirectedEdgeAttributes(parent,parents[parent])["elevationGain"]
        totalDistance += graph.getUndirectedEdgeAttributes(parent,parents[parent])["distance"]
      }
      parent = parents[parent];
   }
//    console.log(shortestPath);
//    console.log("total elevation gain " + totalElevationGain)
//    console.log("total distance " + totalDistance)
   shortestPath.reverse();


   return [shortestPath,totalDistance,totalElevationGain];

};

