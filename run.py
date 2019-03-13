import csv
import logging
from flask import Flask, render_template, jsonify, request, send_from_directory

from new_sis.classAlgo import readData, DICT, getReq, RECORD
from collections import OrderedDict
from flask_cors import CORS
from typing import List, Any, Dict, Tuple
import os

app = Flask(__name__)
# app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
# app.json_encoder.item_seperator = ","
# app.json_encoder.key_seperator = ":"
CORS(app)

RECORDS_DICT = OrderedDict()

ATTR_MAP = {
    0: 'id', 1: 'department', 2: 'number', 3: 'section', 4: 'type', 5: 'units', 6: 'instructor', 7: 'days', 8: 'room',
    9: 'title', 10: 'topic', 11: 'status', 12: 'enrollment', 13: 'enrollment_limit', 14: 'wait_list', 15: 'description'
}


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


def raw_result_to_response(raw_result: List[List[Any]]) -> Tuple[List[List[Any]]]:
    result = []
    for raw_schedule in raw_result:
        schedule = []
        for raw_course in raw_schedule:
            cid = raw_course[0]
            record = RECORD[cid]
            key = str(record[1]).lower() + str(record[2]) + str(record[4])
            for i, v in enumerate(RECORDS_DICT[key][0]):
                if v == cid:
                    sec = i
                    break
            schedule.append([key, sec, cid])

        result.append(schedule)

    return result


@app.route('/api/classes', methods=['GET', 'POST'])
def get_classes():
    if request.method == "GET":
        semester = request.args.get('semester')
        test = request.args.get('test')
        if semester:
            return jsonify(
                {
                    'meta': {
                        'attr_map': ATTR_MAP
                    },
                    'data': RECORDS_DICT,
                }
            )

        if test:
            raw_result = getReq([
                "cs21105",
                "cs21104",
                "span20205",
                "cs21025",
                "sts15001",
                "math33545",
                "sts15005",
            ], 10, Days=["MoTuWeThFr 00:00AM - 08:00AM",
                         "MoTuWeThFr 08:00PM - 10:00PM"])

            result = raw_result_to_response(raw_result)

            return jsonify({
                'meta': {
                    'attr_map': ATTR_MAP,
                },
                'data': result
            })
        return "Missing Request Parameters"

    elif request.method == "POST":
        json = request.get_json()
        classes = json.get('classes')
        num = json.get('num')
        try:
            if type(classes) == list and float(num):
                days = None
                if json.get('filter') is not None:
                    days = json.get('filter').get('days')

                print(days)

                if days is not None and len(days) == 2:
                    result = raw_result_to_response(
                        getReq(classes, num, Days=days))
                else:
                    result = raw_result_to_response(
                        getReq(classes, num))

                return jsonify({
                    'status': {
                        'err': ''
                    },
                    'meta': {
                        'attr_map': ATTR_MAP,
                    },
                    'data': result
                })
            else:
                return jsonify({
                    'status': {
                        'err': 'Invalid class list or number'
                    }
                })

        except Exception as e:
            print(e)
            return jsonify({
                'status': {
                    'err': str(e)
                }
            })


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


def to_short():
    types = set()
    for k, v in DICT.items():
        types.add(v[0][4])
        RECORDS_DICT[k] = [
            [a[0] for a in v],
            v[0][1],
            v[0][2],
            [a[3] for a in v],
            v[0][4],
            v[0][5],
            [a[6].split(",") for a in v],
            [a[7] for a in v],
            [a[8] for a in v],
            v[0][9],
            # [a[9] for a in v],
            [a[10] for a in v],
            [a[11] for a in v],
            [a[12] for a in v],
            [a[13] for a in v],
            [a[14] for a in v],
            v[0][15]
        ]


if __name__ == "__main__":
    logging.info('Loading data...')
    readData()
    to_short()
    logging.info('Running...')

    app.run(host='0.0.0.0', port=8000, debug=True)
