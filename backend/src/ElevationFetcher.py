from flask import Flask, json, request
from ElevationFetcherHelper import process_queries

companies = [{"id": 1, "name": "Company One"}, {"id": 2, "name": "Company Two"}]

api = Flask(__name__)



@api.route('/elevation', methods=['POST', 'GET'])
def get_companies():
    elem_dict = process_queries(request.json)
    return json.dumps({'results':elem_dict})

if __name__ == '__main__':
    api.run() 