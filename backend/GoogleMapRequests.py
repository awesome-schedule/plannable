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


def load_data(api_key, BuildingList, All_Building_Names):
    """
    Read from the raw data sheet to find all buildings at UVa and to store in a set
    Get all the coordinates for each building and export as a json file
    :param api_key: the api key for google api
    :return: void
    """
    with open(get_data_path(All_Building_Names)) as f:
        buildings = list(
            json.load(f).keys())  # store all the buildings in a list

    # use regex to remove all parentesis
    pattern = "[^()]*"
    x = re.compile(pattern)
    new_buildings = []
    for b in buildings:
        match = x.search(b)
        new_buildings.append(
            match.group(0).strip().lower())  # get all lower case names

    with open(get_data_path(BuildingList), 'w') as f:
        jdata = {}
        for count, i in enumerate(new_buildings):
            # get the coordinates
            (lat, lng) = get_coordinate(api_key, i)

            # check if this address is in UVA, because if the coordinate not exist, it will redirect to UVa coordinates
            if float(lat) == 38.0335529 and float(lng) == -78.5079772:
                continue

            # use the place name as key to store the coordination
            jdata[i] = (lat, lng)
            print(count)

        json.dump(jdata, f)


def get_data_path(filename: str):
    """
    Get the Data Path
    :param filename: the file name to be read
    :return: the path to "data" directory which the file is located
    """
    dir_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(dir_path, filename)


def get_coordinate(api_key, bldg):
    """
    Use googlemaps api to get the coordinate of each building
    :param api_key: the api key for google api
    :param bldg: building name at UVa
    :return: [lattitude,longitutude]
    """
    gm = googlemaps.Client(key=api_key)
    geocode_result = gm.geocode('{},UVA'.format(bldg))[0]
    return geocode_result['geometry']['location']['lat'], geocode_result[
        'geometry']['location']['lng']


def create_distance_matrix(api_key, BuildingList, Distance_Matrix):

    with open(get_data_path(BuildingList), "r") as f:
        data = json.load(f)
        keys = list(data.keys())
        jdata2 = {}
        count = 0

        for i in range(len(keys)):
            for j in range(1, len(keys) - i):
                org_name = keys[i]
                dest_name = keys[j]

                origin = tuple(data[org_name])
                destination = tuple(data[dest_name])

                gm = googlemaps.Client(key=api_key)

                # get the data: use imperial: miles and meters
                distance_result = googlemaps.distance_matrix.distance_matrix(
                    gm, origin, destination, mode="walking", units="imperial")

                # duration in seconds
                duration = distance_result['rows'][0]['elements'][0][
                    'duration']['value']

                # distance in meters
                distance = distance_result['rows'][0]['elements'][0][
                    'distance']['value']

                # concatonate the building names as key and use duration and distance as value
                jdata2[org_name + "-" + dest_name] = [duration, distance]
               
                count += 1
                print(duration,distance)
                print(count)
    
    with open(get_data_path(Distance_Matrix), "w") as f:
        json.dump(jdata2, f)
    
    print('success')


if __name__ == "__main__":
    api_key = 'AIzaSyBtHl7NIcG1Dbh5i5D90T6MB6Np8tg7vDc'
    All_Building_Names = "All_Building_Names.json"
    BuildingList = 'BuildingList.json'
    Distance_Matrix = "Distance_Matrix.json"
    create_distance_matrix(api_key, BuildingList,Distance_Matrix)

    #test
    # a = get_coordinate(api_key,"nuclear reactor")
    # print(a)
    # load_data(api_key, BuildingList, All_Building_Names)
    # remove_duplicate('BuildingList.json')
    #38.0335529, -78.5079772