import csv
import logging
from flask import Flask, render_template, jsonify, request
from new_sis.classAlgo import readData, DICT
from collections import OrderedDict

app = Flask(__name__)

RECORDS_SHORT = OrderedDict()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/semesters')
def get_semesters():
    semesters = {
        "s1": {
            "name": "Spring 2019"
        }
    }
    return jsonify(semesters)


@app.route('/api/classes', methods=['GET', 'POST'])
def get_classes():
    if request.method == "GET":
        return jsonify(
            {
                'meta': {
                    'attr_map': {0: 'department', 1: 'number', 2: 'section', 3: 'type', 4: 'units', 5: 'instructor', 6: 'days', 7: 'room', 8: 'title', 9: 'topic', 10: 'status', 11: 'enrollment', 12: 'enrollment_limit', 13: 'wait_list', 14: 'description'}
                },
                'data': RECORDS_SHORT
            }
        )
    return "haha"


@app.route('/<any_text>')
def default_handler(any_text):
    return render_template('errors/404.html')


def to_short():
    for k, v in DICT.items():
        RECORDS_SHORT[k] = [course[:10] for course in v]


if __name__ == "__main__":
    logging.info('Loading data...')
    readData()
    to_short()
    logging.info('Running...')

    app.run(host='0.0.0.0', port=8000, debug=True)
