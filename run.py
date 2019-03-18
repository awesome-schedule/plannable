import csv
import logging
from flask import Flask, render_template, jsonify, request, send_from_directory

from backend.data_loader import readData, DICT, RECORD, RECORDS_DICT, ATTR_MAP, TYPES, STATUSES
from collections import OrderedDict
from flask_cors import CORS
from typing import List, Any, Dict, Tuple
import os

app = Flask(__name__)

# allow any origin
CORS(app)


@app.route('/')
def home():
    return render_template('dist/index.html')


@app.route('/api/semesters')
def get_semesters():
    semesters = [
        {
            "id": 0,
            "name": "Spring 2019"
        },
        {
            "id": 1,
            "name": "Fall 2018"
        }
    ]
    return jsonify(semesters)


@app.route('/api/classes', methods=['GET', 'POST'])
def get_classes():
    if request.method == "GET":
        semester = request.args.get('semester')
        test = request.args.get('test')
        if semester:
            return jsonify(
                {
                    'meta': {
                        'attr_map': ATTR_MAP,
                        'types': TYPES,
                        'statuses': STATUSES
                    },
                    'data': RECORDS_DICT,
                }
            )

        return "Missing Request Parameters"


@app.route('/about')
def default_handler():
    return render_template('dist/contact.html')


@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'templates', 'dist', 'js'), path)


@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'templates', 'dist', 'css'), path)


# @app.route('/<any_text>')
# def default_handler(any_text):
#     return render_template('errors/404.html')


if __name__ == "__main__":
    logging.info('Loading data...')
    readData()
    logging.info('Running...')
    app.run(host='0.0.0.0', port=8000, debug=True)
