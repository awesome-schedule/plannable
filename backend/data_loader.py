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
from tqdm import tqdm
import json

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
CLASS_TYPES = {'Clinical': 0, 'Discussion': 1, 'Drill': 2, 'Independent Study': 3, 'Laboratory': 4,
               'Lecture': 5, 'Practicum': 6, 'Seminar': 7, 'Studio': 8, 'Workshop': 9}

STATUSES = {
    'Open': 1,
    'Closed': 0,
    'Wait List': 2
}


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
    data_dir = os.path.join(dir_path, "data")
    if not os.path.isdir(data_dir):
        os.mkdir(data_dir)
    return os.path.join(data_dir, filename)


def load_semester_data(semester_index):
    semester = SEMESTERS[semester_index]
    semester_id = semester['id']

    key_map = defaultdict(list)

    Log.info('Parsing Course Data of {}'.format(semester['name']))
    arr_start = 6
    arr_end = 22
    arr_step = 4
    with open(get_data_path("CS{}Data.csv").format(semester_id)) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = -1
        for raw_row in tqdm(csv_reader):
            line_count += 1
            if line_count == 0:
                continue
            try:
                raw_row[0] = int(raw_row[0])
                raw_row[4] = CLASS_TYPES.get(raw_row[4], -1)
                raw_row[24] = STATUSES.get(raw_row[24], -1)
                raw_row[25] = int(raw_row[25])
                raw_row[26] = int(raw_row[26])
                raw_row[27] = int(raw_row[27])
                key = (raw_row[1] + raw_row[2] + str(raw_row[4])).lower()
                combined_row = raw_row[0:arr_start]
                combined_row.extend(raw_row[arr_end:])
                meeting_times = [raw_row[x:x+arr_step]
                                 for x in range(arr_start, arr_end, arr_step) if raw_row[x] and raw_row[x+1]]
                meeting_times.sort(key=lambda x: x[1])
                combined_row.append(meeting_times)
                key_map[key].append(combined_row)
            except Exception as e:
                Log.warning('Error Parsing \n {} \n {}'.format(
                    str(raw_row), str(e)))
                continue
        for key in list(key_map.keys()):
            if len(key_map[key]) == 0:
                del key_map[key]
        Log.info('Processed {} lines.'.format(line_count))
    # print(key_map[list(key_map.keys())[95]])

    # 1 4 9 10 11 12 13
    allRecords = dict()

    list_indices = [0, 3, 7, 8, 9, 10, 11, 13]
    for k, v in key_map.items():
        record = []
        sections = [[] for i in range(len(v))]
        for i in range(14):
            if i in list_indices:
                for j, a in enumerate(v):
                    sections[j].append(a[i])
            else:
                record.append(v[0][i])
        record.append(sections)
        allRecords[k] = record

    # print(allRecords[list(key_map.keys())[95]])

    json.dump(allRecords, open(get_data_path(
        "CS{}Data.json").format(semester_id), 'w'), separators=(',', ':'))

    return allRecords


def update_local_data():

    # api-endpoint
    url = "https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php"

    for semester in SEMESTERS:
        Log.info('Updating data for semester {}'.format(semester['name']))
        semester_id = semester['id']
        params = {'Semester': (None, semester_id), 'Group': (None, 'CS'),
                  'Description': (None, 'Yes'), 'submit': (None, 'Submit Data Request'), 'Extended': (None, 'Yes')}

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
    # update_local_data()
    load_all_data()
