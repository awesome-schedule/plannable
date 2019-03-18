import xlrd  # CSV file does not work well, so I decide to use excel instead
from typing import *
import re
import os
from collections import OrderedDict, defaultdict
import random

# a mapping from course ID to list of Course
DICT = OrderedDict()  # type: Dict[int, List[List[Union[int, str]]]]
# a mapping from course key to list of Course
RECORD = OrderedDict()  # type: Dict[int, List[List[Union[int, str]]]]
# a mapping from course key to a CourseRecord

# type: Dict[int, List[Union[List[int], List[str], int, str]]]
RECORDS_DICT = OrderedDict()

ATTR_MAP = {
    0: 'id', 1: 'department', 2: 'number', 3: 'section', 4: 'type', 5: 'units', 6: 'instructor', 7: 'days', 8: 'room',
    9: 'title', 10: 'topic', 11: 'status', 12: 'enrollment', 13: 'enrollment_limit', 14: 'wait_list', 15: 'description'
}

TYPES = {'Clinical': 0, 'Discussion': 1, 'Drill': 2, 'Independent Study': 3, 'Laboratory': 4,
         'Lecture': 5, 'Practicum': 6, 'Seminar': 7, 'Studio': 8, 'Workshop': 9}

STATUSES = {
    'Open': 1,
    'Closed': 0,
    'Wait List': 2
}


def getDataPath(filename: str):
    """
    Get the Data Path
    :param filename: the file name to be read
    :return: the path to "data" directory which the file is located
    """
    dir_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(dir_path, "data", filename)


def readData():
    """
    Read all the classes and put in a dictionary called DICT
    :return:
    """
    file = xlrd.open_workbook(getDataPath('CS1192Data.xlsx'))

    sheet = file.sheet_by_index(0)
    for i in range(1, sheet.nrows):
        row = sheet.row_values(i)

        # convert id and course number to number
        row[0] = int(row[0])
        row[2] = int(row[2])

        # a section may be an int or a str
        try:
            row[3] = int(row[3])
        except:
            row[3] = str(row[3])

        row[4] = TYPES[row[4]]

        row[11] = STATUSES[row[11]]
        for i in range(12, 15):
            row[i] = int(row[i])

        category = str(row[1]).lower()
        number = str(row[2])
        lecture = str(row[4]).lower()
        course = category + number + lecture

        if DICT.get(course):
            DICT[course].append(row)
        else:
            DICT[course] = [row]

        id = row[0]
        if RECORD.get(id):
            raise ValueError('Duplicated ID')
        else:
            RECORD[id] = row

    to_short()


def to_short():
    for k, v in DICT.items():
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
            [a[10] for a in v],
            [a[11] for a in v],
            [a[12] for a in v],
            [a[13] for a in v],
            [a[14] for a in v],
            v[0][15]
        ]
