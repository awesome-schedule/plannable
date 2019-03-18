import csv
import logging
from flask import Flask, render_template, jsonify, request, send_from_directory

from backend.data_loader import load_all_data, update_local_data, ATTR_MAP, CLASS_TYPES, STATUSES, SEMESTERS, ALL_SEMESTER_RECORDS
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
    return jsonify(SEMESTERS)


@app.route('/api/classes', methods=['GET', 'POST'])
def get_classes():
    if request.method == "GET":
        semester = request.args.get('semester')
        test = request.args.get('test')
        if semester:
            try:
                semester = int(semester)
            except:
                return "Semester id must be an integer"
            return jsonify(
                {
                    'meta': {
                        'attr_map': ATTR_MAP,
                        'types': CLASS_TYPES,
                        'statuses': STATUSES
                    },
                    'data': ALL_SEMESTER_RECORDS[semester],
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
    update_local_data()
    load_all_data()
    app.run(host='0.0.0.0', port=8000, debug=False)
