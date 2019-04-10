import os
import requests
import io
import csv
from typing import *
import re
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

def load_data():
    with open(get_data_path("CS1198Data.csv")) as csvfile:
        data = csv.reader(csvfile)
        pattern = r"[^0-9]*"
        x = re.compile(pattern)
        s = set()
        for count,i in enumerate(data):
            if count == 0:
                continue
            match = x.search(i[8])
            if match.group(0) == "TBA":
                continue
            s.add(match.group(0))
    with open(get_data_path('BuildingList.csv'),'w') as f:
        for i in s:
            print(i, file = f)

load_data()