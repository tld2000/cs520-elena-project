import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';


export async function fetchAsync (startCoord,endCoord) {

    let query = undefined;

    console.log(startCoord,endCoord)
    // Allow some leeway around coordinates to make path
    if(startCoord[1] < endCoord[1]){
        let minCoord = [startCoord[0]-0.003,startCoord[1]-0.003]
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
    let result = await getElevation(data.elements,startCoord,endCoord)
    return [data.elements,result];
  }

/**
 * Traverse through data elements to return all elevations
 * @param  {Any} elements - Data elements
 * @return {Any} response - Elevations of data elements
 */
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
          console.log(temp)
          return temp
        }).then((result) => {
            console.log(result)
            return result['results']
        })
    return response
}

 /**
 * Traverse through weighted nodes to return the minimum weight node
 * @param  {Any} weights - Weights of all nodes
 * @param  {Any} visited - The nodes already visited
 * @return {String} shortest - Minimum weight node
 */
export function minWeightNode (weights, visited){
     
      let shortest = null;
      for (let node in weights) {
          let currShortest = shortest === null || weights[node] < weights[shortest];
          if (currShortest && !visited.includes(node)) {
              shortest = node;
          }
      }
      return shortest;
  };

 /**
 * Traverse through weighted nodes to return the maximum weight node
 * @param  {Any} weights - Weights of all nodes
 * @param  {Any} visited - The nodes already visited
 * @return {String} max - Maximum weight node
 */
export function maxWeightNode (weights, visited){
     
    let max = null;
    for (let node in weights) {
        let currMax = max === null || weights[node] > weights[max];
        if (currMax && !visited.includes(node)) {
            max = node;
        }
    }
    return max;
};

/**
 * Traverse through the full path graph to find a path
 * @param {Graph} graph - The full path graph
 * @param {Any} startNode - The starting node
 * @param {Any} endNode - The ending node
 * @param {Any} maxIncrease - The maximum amount to increase elevation by
 * @param {Any} maximize - Attribute to maximize elevation gain
 * @return {Array: [Any, Number, Number]} [shortestPath, totalDistance, totalElevationGain] - 
 * [The shortest path in terms of maximizing elevation,
 * The total distance in miles,
 * The total elevation gain in miles]
 */
export function findPath(graph, startNode, endNode,maxIncrease,maximize){

    let startCoord = graph.getNodeAttributes(startNode)["coordinates"]
    let endCoord = graph.getNodeAttributes(endNode)["coordinates"]
    console.log(startCoord)
    console.log(endCoord)
    let visitedNode ={}
    let weights = {};
    let distance = {};
    if(maximize == true){
        distance[endNode] = 0;
        weights[endNode] = 0;
    }
    else{
        distance[endNode] = Infinity;
        weights[endNode] = Infinity;
    }
    let parents = {};
    parents[endNode] = null;
    for(let i = 0; i < graph.neighbors(startNode).length; i++){
        let child = graph.neighbors(startNode)[i]
        distance[child] =  graph.getUndirectedEdgeAttributes(startNode, child)['distance'];
        weights[child] = graph.getUndirectedEdgeAttributes(startNode, child)['elevationGain'];
        parents[child] = startNode;
    }

    let visited = [];
    let node = null;
    node = maximize ? maxWeightNode(weights, visited) : minWeightNode(weights, visited);
 
    while (node) {
       let weight = weights[node];
       let children = graph.neighbors(node); 
       for(let i = 0; i < children.length; i++){
          let child = children[i]
          if (String(child) === String(startNode)) {
             continue;
          } else {
             let value = graph.getUndirectedEdgeAttributes(node, child)['elevationGain']
             value = value !== 0 ? value : 0.00001;
             let newWeight = weight + value;
             let newDist = distance[node] + graph.getUndirectedEdgeAttributes(node, child)['distance'];
             console.log(newDist)
             if(newDist > maxIncrease){
                newWeight += 1;
             }
             if (!maximize && (!weights[child] || weights[child] >= newWeight)) {
                weights[child] = newWeight;
                distance[child] = newDist;
                parents[child] = node;
            } 
            if (maximize && (!weights[child] || weights[child] <= newWeight)) {

                weights[child] = newWeight;
                distance[child]= newDist;
                parents[child] = node;
            } 
         }
      } 
    if(visitedNode[node] == undefined) visitedNode[node] = 0
    visitedNode[node] += 1
    visited.push(node);
    node = maximize ? maxWeightNode(weights, visited) : minWeightNode(weights, visited);
   }
   console.log("start node " + startNode)
   console.log("end node" + endNode)
   console.log("parents " + JSON.stringify(parents, null, 4))
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
   console.log(shortestPath);
   console.log("total elevation gain " + totalElevationGain)
   console.log("total distance " + totalDistance)
   shortestPath.reverse();
   return [shortestPath,totalDistance,totalElevationGain];
}

/**
 * Traverse through the full path graph to find the shortest path
 * @param {Graph} graph - The full path graph
 * @param {Any} startNode - The starting node
 * @param {Any} endNode - The ending node
 * @param {Any} attribute - The attribute of the node
 * @return {Array: [Any, Number, Number]} [shortestPath, totalDistance, totalElevationGain] - 
 * [The shortest path,
 * The total distance in miles,
 * The total elevation gain in miles]
 */
export function findShortestPath (graph, startNode, endNode,attribute) {
    attribute = typeof attribute !== 'undefined' ? attribute : 'distance';
    let startCoord = graph.getNodeAttributes(startNode)["coordinates"]
    let endCoord = graph.getNodeAttributes(endNode)["coordinates"]
    console.log(startCoord)
    console.log(endCoord)

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
   console.log("start node " + startNode)
   console.log("end node" + endNode)
   console.log("parents " + JSON.stringify(parents, null, 4))
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
   console.log(shortestPath);
   console.log("total elevation gain " + totalElevationGain)
   console.log("total distance " + totalDistance)
   shortestPath.reverse();
   return [shortestPath,totalDistance,totalElevationGain];

};

