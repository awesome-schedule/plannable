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


def load_data(api_key,jfile):
    """
    Read from the raw data sheet to find all buildings at UVa and to store in a set
    Get all the coordinates for each building and export as a json file
    :param api_key: the api key for google api
    :return: void
    """

    # I manually deleted three entry: UVA, Desktop-Asynchronous, Office
    weird_places = {"UVA", "Desktop", "Office", "TBA", "Web"}

    with open(get_data_path("CS1198Data.csv")) as csvfile:
        data = csv.reader(csvfile)

        # Only allow alphabetical letter and space
        pattern = r"[a-zA-Z ]*"
        x = re.compile(pattern)

        s = set()
        for count, i in enumerate(data):
            if count == 0:
                continue
            match = x.search(i[8])
            match = match.group(0).strip()
            if match in weird_places:
                continue
            s.add(match)

    print(len(s))

    with open(get_data_path(jfile), 'w') as f:
        jdata = {}
        for count, i in enumerate(s):
            (lat, lng) = get_coordinate(api_key, i)

            # to remove duplicate, get the first two/one letter of the place, all lower cases
            pattern = "[a-zA-Z]*( [a-zA-Z]*)?"
            x = re.compile(pattern)
            match = x.search(i)
            match = match.group(0).lower().strip()

            # use the place name as key to store the coordination
            jdata[match] = (lat, lng)
            print(count)

        json.dump(jdata, f)


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


def get_coordinate(api_key, bldg):
    """
    Use googlemaps api to get the coordinate of each building
    :param api_key: the api key for google api
    :param bldg: building name at UVa
    :return: [lattitude,longitutude]
    """
    gm = googlemaps.Client(key=api_key)
    geocode_result = gm.geocode('{}, Charlottesville'.format(bldg))[0]
    return geocode_result['geometry']['location']['lat'], geocode_result[
        'geometry']['location']['lng']


def create_distance_matrix(api_key,jfile):

    with open(get_data_path(jfile),"r") as f:
        data = json.load(f)
        keys = list(data.keys())
        print(keys)
        jdata2 = {}
        for i in range(len(keys)):
            for j in range(1,len(keys) - i):
                org_name = keys[i]
                dest_name = keys[j]

                origin = tuple(data[org_name])
                destination = tuple(data[dest_name])

                gm = googlemaps.Client(key=api_key)
                distance_result = googlemaps.distance_matrix.distance_matrix(gm,origin,destination,mode="walking")

                # duration in seconds
                duration = distance_result['rows'][0]['elements'][0]['duration']['value']

                # distance in meters
                distance = distance_result['rows'][0]['elements'][0]['distance']['value']

                print(distance_result['rows'][0]['elements'][0]['duration'])
                jdata2[org_name+"-"+dest_name] = [duration,distance]
                print(jdata2)
                input()
        # input()
        # origin = tuple(data['ruffner hall'])
        # destination = tuple(data['minor hall'])
        # print(origin)
        # input()
        
        print()
        # get_distance_matrix(api_key, origin, destination)



if __name__ == "__main__":
    api_key = 'AIzaSyDIy_75CVKiA_jFTcNL6x9OhMR7shLmrCg'

    jfile = 'BuildingList.json'
    create_distance_matrix(api_key,jfile)
    
    #test

    # load_data(api_key,jfile)
    # remove_duplicate('BuildingList.json')