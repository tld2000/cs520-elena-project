from flask import Flask, json, request
from ElevationFetcherHelper import process_queries

def run_server():

    api = Flask(__name__)
    """
    Run the Flask server
    """
    @api.route('/elevation', methods=['POST', 'GET'])
    def get_companies():
        elem_dict = process_queries(request.json)
        return json.dumps({'results':elem_dict})
    
    api.run()

if __name__ == '__main__':
    run_server()