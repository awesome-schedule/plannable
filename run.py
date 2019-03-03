import csv
import logging
from flask import Flask, render_template, jsonify, request
from new_sis.classAlgo import readData, DICT, getReq, RECORD
from collections import OrderedDict
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

RECORDS_DICT = OrderedDict()
RECORDS_KEYS = []

ATTR_MAP = {
    0: 'id', 1: 'department', 2: 'number', 3: 'section', 4: 'type', 5: 'units', 6: 'instructor', 7: 'days', 8: 'room',
    9: 'title', 10: 'topic', 11: 'status', 12: 'enrollment', 13: 'enrollment_limit', 14: 'wait_list', 15: 'description'
}


@app.route('/')
def home():
    return render_template('index.html')


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
                        'attr_map': ATTR_MAP
                    },
                    'data': RECORDS_DICT,
                    'keys': RECORDS_KEYS,
                }
            )

        if test:
            raw_result = getReq([
                "cs2110lecture",
                "cs2110laboratory",
                "span2020lecture",
                "cs2102lecture",
                "sts1500discussion",
                "math3354lecture",
                "sts1500lecture",
            ], 10)
            course_data = dict()

            result = []
            for raw_schedule in raw_result:
                schedule = []
                for raw_course in raw_schedule:
                    cid = raw_course[0]
                    schedule.append(cid)
                    if not course_data.get(cid):
                        course_data[cid] = RECORD[cid]

                result.append(schedule)

            return jsonify({
                'meta': {
                    'attr_map': ATTR_MAP,
                    'course_data': course_data
                },
                'data': result
            })
        return "!!!"

    elif request.method == "POST":
        return jsonify({
            'meta': {
                'attr_map': ATTR_MAP
            },
            'data': getReq([
                "CS2110Lecture",
                "CS2110Laboratory",
                "SPAN2020Lecture",
                "CS2102Lecture",
                "STS1500Discussion",
                "MATH3354Lecture",
                "STS1500Lecture",
            ], None)
        })
    return "haha"


@app.route('/<any_text>')
def default_handler(any_text):
    return render_template('errors/404.html')


def to_short():
    for k, v in DICT.items():
        RECORDS_DICT[k] = v[0][:10]
        RECORDS_KEYS.append(k)


if __name__ == "__main__":
    logging.info('Loading data...')
    readData()
    to_short()
    logging.info('Running...')

    app.run(host='0.0.0.0', port=8000, debug=True)
