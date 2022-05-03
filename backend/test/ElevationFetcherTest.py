import unittest
import sys
import os
import requests
import time
import json
import random

parent_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, f'{parent_dir}/src')
from ElevationFetcher import run_server
from ElevationFetcherHelper import coords_to_api_query, process_queries, send_queries

class TestElevationFetcherHelper(unittest.TestCase):
    TEST_COORD = [-72.12345, 42.12345]
    TEST_ELEVATION = 209.48382568359375
    
    def test_process_queries(self):
        # setting up mock data
        data = None
        with open(f'{parent_dir}/test/test_query.json') as json_file:
            data = json.load(json_file)
        
        elevation_dict = process_queries(data)
        # check for correct query
        for elem in elevation_dict:
            for node in elevation_dict[elem]:
                self.assertEqual(elevation_dict[elem][node], self.TEST_ELEVATION)
        
        # check for correct number of elevation values return
        self.assertEqual(sum([len(data[n]) for n in data]), sum([len(elevation_dict[n]) for n in elevation_dict]))
        
        
    def test_send_queries(self):
        # setting up mock data
        num_queries = random.randint(1,101)
        elevation_list = [self.TEST_ELEVATION for n in range(num_queries)]
        query_coords = [self.TEST_COORD for n in range(num_queries)]
        
        elevations = send_queries(query_coords)
        self.assertEqual(elevations, elevation_list)
        
        
    def test_coords_to_api_query(self):
        self.assertEqual('42.12345,-72.12345', coords_to_api_query(self.TEST_COORD))
        