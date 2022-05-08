import requests
import time

def process_queries(json_data):
    """
    Split received coordinate data into sets of 100 coordinates per query, get the elevation from https://api.opentopodata.org/ and return the elevation values
    Arguments:
        json_data: a dictionary, structured element_id:node_id:[longtitude, latitude]
    Returns:
        The dictionary contains all elevation for all node, structured element_id:node_id:elevation
    """
    loc_num = sum([len(json_data[n]) for n in json_data])
    
    count = 0
    node_list = []
    elem_dict = {}
    query_coords = []
    elevation_list = []
    
    
    for element_id in json_data:
        elem_dict[element_id] = {}
        for node in json_data[element_id]:
            elem_dict[element_id][node] = None
            
            node_list.append(node)
            
            query_coords.append(json_data[element_id][node])
            count += 1
            
            if count % 100 == 0 or count == loc_num:
                elevations = send_queries(query_coords)
                time.sleep(1)
                elevation_list = elevation_list + elevations
                query_coords = []
                time.sleep(1)

    for i in range(len(elevation_list)):
        for element_id in json_data:
            if node_list[i] in elem_dict[element_id]:
                elem_dict[element_id][node_list[i]] = elevation_list[i]
    
    return elem_dict


def send_queries(query_coords):
    """
    Prepare the list of coordinates for querying
    Arguments:
        query_coords: list of 100 or less coordinates
    Returns:
        The list of elevations
    """
    url = 'https://api.opentopodata.org/v1/ned10m?locations='
    query_length = len(query_coords)
    for i in range(query_length):
        if i == query_length-1:
            url += coords_to_api_query(query_coords[query_length-1])
        else:
            url += f'{coords_to_api_query(query_coords[i])}|'
    
    response = requests.get(url).json()
    #print(response)
    
    return [n['elevation'] for n in response['results']]


def coords_to_api_query(coord):
    """
    Convert coordinate to string
    Arguments:
        coord: coordinate structured as [longtitude, latitude]
    Returns:
        Coordiante as string
    """
    return f'{coord[1]},{coord[0]}'