import csv
import logging
from flask import Flask, render_template, jsonify, request
from new_sis.classAlgo import readData, DICT, Algorithm
from collections import OrderedDict
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

RECORDS_SHORT = OrderedDict()
ATTR_MAP = {
    0: 'department', 1: 'number', 2: 'section', 3: 'type', 4: 'units', 5: 'instructor', 6: 'days', 7: 'room',
    8: 'title', 9: 'topic', 10: 'status', 11: 'enrollment', 12: 'enrollment_limit', 13: 'wait_list', 14: 'description'
}


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


def callAlgorithm(classes):
    classList = []
    for i in classes:
        classList.append(DICT[i])
    return Algorithm(classList)


@app.route('/api/classes', methods=['GET', 'POST'])
def get_classes():
    if request.method == "GET":
        t = request.args.get('t')

        if t is not None:
            return jsonify(
                {
                    'meta': {
                        'attr_map': ATTR_MAP
                    },
                    'data': callAlgorithm([
                        "CS2110Lecture",
                        "CS2110Laboratory",
                        "SPAN2020Lecture",
                        "CS2102Lecture",
                        "STS1500Discussion",
                        "MATH3354Lecture",
                        "STS1500Lecture",
                    ])
                }
            )
        else:
            return jsonify(
                {
                    'meta': {
                        'attr_map': ATTR_MAP
                    },
                    'data': RECORDS_SHORT
                }
            )
    elif request.method == "POST":
        return jsonify({
            'meta': {
                'attr_map': ATTR_MAP
            },
            'data': callAlgorithm([
                "CS2110Lecture",
                "CS2110Laboratory",
                "SPAN2020Lecture",
                "CS2102Lecture",
                "STS1500Discussion",
                "MATH3354Lecture",
                "STS1500Lecture",
            ])
        })
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
