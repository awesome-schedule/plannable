"""Find the official building list on UREG: http://www.virginia.edu/registrar/buildings.html"""

import os
import requests
from bs4 import BeautifulSoup
import json

page = requests.get('http://www.virginia.edu/registrar/buildings.html').text

soup = BeautifulSoup(page, 'html.parser')

table = soup.find_all('table')[0]  # there is only one table

path = os.path.dirname(os.path.abspath(__file__))
All_Building_Names = "All_Building_Names.json"


with open(path + "/" + All_Building_Names, "w") as f:
    jdata = {}
    for row in table.find_all('tr'):
        columns = row.find_all('td')
        
        key = columns[1].get_text() # Clark Hall
        value = columns[0].find('strong').get_text() #CLK
        
        jdata[key] = value
    json.dump(jdata,f)

