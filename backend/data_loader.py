import requests
import shutil
from typing import *
import os
from collections import OrderedDict, defaultdict
import csv
import traceback
import io
from colorama import Back as B, Fore as F
import requests

ALL_SEMESTER_RECORDS = []

SEMESTERS = [
    {
        "id": "1188",
        "name": "Fall 2018"
    },
    {
        "id": "1191",
        "name": "January 2019"
    },
    {
        "id": "1192",
        "name": "Spring 2019"
    },
    {
        "name": "Summer 2019",
        "id": "1196"
    },
    {
        "name": "Fall 2019",
        "id": "1198"
    },
]

ATTR_MAP = {
    0: 'id', 1: 'department', 2: 'number', 3: 'section', 4: 'type', 5: 'units', 6: 'instructor', 7: 'days', 8: 'room',
    9: 'title', 10: 'topic', 11: 'status', 12: 'enrollment', 13: 'enrollment_limit', 14: 'wait_list', 15: 'description'
}

CLASS_TYPES = {'Clinical': 0, 'Discussion': 1, 'Drill': 2, 'Independent Study': 3, 'Laboratory': 4,
               'Lecture': 5, 'Practicum': 6, 'Seminar': 7, 'Studio': 8, 'Workshop': 9}

STATUSES = {
    'Open': 1,
    'Closed': 0,
    'Wait List': 2
}


RAW_DATA_TYPES = {
    0: int, 1: str, 2: int, 3: str, 4: CLASS_TYPES.__getitem__, 5: str, 6: str, 7: str, 8: str, 9: str, 10: str, 11: STATUSES.__getitem__, 12: int, 13: int, 14: int, 15: str
}

# ALL_RECORD_TYPES = {
#     0: list, 1: str, 2: int, 3: list, 4: int, 5: float, 6: list,
# }


class Log:
    @staticmethod
    def info(s, end=" "):
        print(B.GREEN + F.BLACK + " Info " + F.RESET + B.RESET, end=end)
        print(F.GREEN + s + F.RESET)

    @staticmethod
    def warning(s, end=" "):
        print(B.YELLOW + F.BLACK + " Warning " + F.RESET + B.RESET, end=end)
        print(F.YELLOW + s + F.RESET)

    @staticmethod
    def error(s, end=" "):
        print(B.RED + " Error " + B.RESET, end=end)
        print(F.RED + s + F.RESET)


def get_data_path(filename: str):
    """
    Get the Data Path
    :param filename: the file name to be read
    :return: the path to "data" directory which the file is located
    """
    dir_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(dir_path, "data", filename)


def load_semester_data(semester_index):
    semester = SEMESTERS[semester_index]
    semester_id = semester['id']

    key_map = defaultdict(list)

    def get_key(row: List[str]):
        return (row[1] + row[2]+row[4]).lower()

    def parse(raw_row: List[str]):
        row = raw_row.copy()
        for idx, _type in RAW_DATA_TYPES.items():
            try:
                row[idx] = _type(row[idx])
            except Exception as e:
                Log.warning('Error Parsing \n {} \n {}'.format(
                    str(raw_row), traceback.format_exc()))
        return row

    Log.info('Parsing Course Data of {}'.format(semester['name']))
    with open(get_data_path("CS{}Data.csv").format(semester_id)) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = -1
        for raw_row in csv_reader:
            line_count += 1
            if line_count == 0:
                continue
            key_map[get_key(raw_row)].append(parse(raw_row))
        Log.info('Processed {} lines.'.format(line_count))

    allRecords = dict()

    for k, v in key_map.items():
        allRecords[k] = [
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
            [a[10] for a in v],
            [a[11] for a in v],
            [a[12] for a in v],
            [a[13] for a in v],
            [a[14] for a in v],
            v[0][15]
        ]

    return allRecords


def update_local_data():

    # api-endpoint
    url = "https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php"

    for semester in SEMESTERS:
        Log.info('Updating data for semester {}'.format(semester['name']))
        semester_id = semester['id']
        params = {'Semester': (None, semester_id), 'Group': (None, 'CS'),
                  'Description': (None, 'Yes'), 'submit': (None, 'Submit Data Request')}

        # sending post request. use "files" because Lou's list uses multipart/form-data format
        r = requests.post(url=url, files=params)
        response = io.StringIO(r.text)

        # save data locally
        with open(get_data_path('CS{}Data.csv'.format(semester_id)), 'w') as out_file:
            shutil.copyfileobj(response, out_file)


def load_all_data():
    for i, semester in enumerate(SEMESTERS):
        ALL_SEMESTER_RECORDS.append(load_semester_data(i))


if __name__ == "__main__":
    update_local_data()
    load_all_data()
