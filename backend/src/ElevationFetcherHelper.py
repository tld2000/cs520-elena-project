import requests
import time

def process_queries(json_data):
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
            
            # if node in node_list:
            #     print("node " + node)
            node_list.append(node)
            
            query_coords.append(json_data[element_id][node])
            count += 1
            
            if count % 100 == 0 or count == loc_num:
                elevations = send_queries(query_coords)
                elevation_list = elevation_list + elevations
                query_coords = []
                time.sleep(1)

    for i in range(len(elevation_list)):
        for element_id in json_data:
            if node_list[i] in elem_dict[element_id]:
                elem_dict[element_id][node_list[i]] = elevation_list[i]
    
    return elem_dict

def send_queries(query_coords):
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
    return f'{coord[1]},{coord[0]}'