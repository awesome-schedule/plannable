import csv
import urllib.request
import json
import time
import datetime
import googlemaps
import os
import re
from typing import *
import io



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


def load_data(api_key):
    with open(get_data_path("CS1198Data.csv")) as csvfile:
        data = csv.reader(csvfile)
        pattern = r"[^0-9]*"
        x = re.compile(pattern)
        s = set()
        for count, i in enumerate(data):
            if count == 0:
                continue
            match = x.search(i[8])
            if match.group(0) == "TBA":
                continue
            s.add(match.group(0))

    with open(get_data_path('BuildingList.json'), 'w') as f:
        jdata = {}
        for count,i in enumerate(s):
            [lat, lng] = get_coordinate(api_key, i)
            jdata[i] = [lat,lng]
            print(count)
        json.dump(jdata,f)


def get_data(api_key, origin, destination):
    # site we want to get data from
    site = 'https://maps.googleapis.com/maps/api/'

    service = 'distancematrix/json?'

    locations = 'origins={}&destinations={}&departure_time=now&'.format(
        origin, destination)

    key = 'key={}'.format(api_key)

    url = site + service + locations + key

    data = request_data(url)
    print(data)


def request_data(url):
    data = urllib.request.urlopen(url)
    return json.loads(data.read())


def get_coordinate(api_key, bldg):
    gm = googlemaps.Client(key=api_key)
    geocode_result = gm.geocode('{}, Charlottesville'.format(bldg))[0]
    return geocode_result['geometry']['location']['lat'], geocode_result[
        'geometry']['location']['lng']


if __name__ == "__main__":
    api_key = 'AIzaSyD1qX2xMo4wdGtI0qKyGLk1eLtLQ4ZSW_Y'
    origin = 'Rice Hall'  #UCLA
    destination = 'Maury Hall'  #UCSD
    # get_data(api_key,origin,destination)
    # get_coordinate(api_key, origin)
    load_data(api_key)