import xlrd  # CSV file does not work well, so I decide to use excel instead
from typing import *
import re

DICT = {}
lectureType = (
    "Laboratory", "Studio", "Seminar", "Clinical", "Practicum", "Discussion", "Drill", "Independent Study", "Lecture",
    "Workshop")


def readData():
    """
    Read all the classes and put in a dictionary called DICT
    :return:
    """
    file = xlrd.open_workbook("CS1192Data.xlsx")
    sheet = file.sheet_by_index(0)
    for i in range(1, sheet.nrows):
        category = str(sheet.cell_value(i, 1))
        number = str(int(sheet.cell_value(i, 2)))
        lecture = str(sheet.cell_value(i,4))
        course = category + number + lecture
        print(course)
        input()
        DICT[course] = DICT.get(course, []) + [sheet.row_values(i)]



def readTitle():
    """
    Get all the class titles and output the classTitle.csv
    :return:
    """
    file = xlrd.open_workbook("CompSci1192.xlsx")
    sheet = file.sheet_by_index(0)
    aSet = set()
    for i in range(1, sheet.nrows):
        category = str(sheet.cell_value(i, 1))
        number = str(int(sheet.cell_value(i, 2)))
        course = category + number
        aSet.add(course)
    with open("CompSci_classTitle.csv", "w") as f:
        for element in aSet:
            print(element, file=f)


def readTime():
    """
    Get all the class titles and output the classTime.csv
    :return:
    """
    file = xlrd.open_workbook("CS1192Data.xlsx")
    sheet = file.sheet_by_index(0)
    aSet = set()
    for i in range(1, sheet.nrows):
        info = sheet.cell_value(i, 7).strip()
        aSet.add(info)
    with open("classTime.csv", "w") as f:
        for element in aSet:
            print(element, file=f)
    print(len(aSet))


def getReq(classes: list, filters: list):
    # return a list contain a lists of classes 3 dimension: classname, classtime, class info
    classList = []
    for theClass in classes:
        classList.append(DICT[theClass])

    return classList


def Algorithm(classList: List):
    classNum = 0  # the sequence of the class
    choiceNum = 0  # the sequence of the choices within one class
    timeNum = 7  # the time which the schedule info is stored
    timeTable = []  # table store all the time so that we can compare
    tempTable = []  # the temp table which stores all the info in the current matches
    finalTable = []  # the final result of all the full matches
    pathMemory = [0] * len(classList)  # the path the search has taken
    while True:
        if classNum >= len(classList):
            # made a full match and keep searching in the last class
            finalTable.append(tempTable)
            classNum -= 1
            choiceNum += 1

        classList, classNum, choiceNum, pathMemory, exhausted = AlgorithmRetract(classList, classNum, choiceNum,
                                                                                 pathMemory)
        if exhausted:
            break
        # print("debug 3: ClassList",classNum,choiceNum,timeNum)
        # get date and time block
        try:
            (date, timeBlock) = parseTime(classList[classNum][choiceNum][timeNum])
        except IndexError:
            # it will stuck in loop : retract method: choiceNum >= len(classList[classNum]) - 1 not choiceNum == len(classList[classNum]) - 1
            print("indexError", classList[classNum], choiceNum, timeNum)
            input()
        # print("debug 1")
        # print("timetable:",timeTable,date,timeBlock)
        # input()
        if not checkTimeConflict(timeTable, date, timeBlock):
            # if the schedule matches, record the next path memory and go to the next class
            timeTable.append((date, timeBlock))
            tempTable.append(classList[classNum][choiceNum])
            pathMemory[classNum] = choiceNum + 1
            classNum += 1
        else:
            choiceNum += 1
    print(finalTable)
    return finalTable


def AlgorithmRetract(classList, classNum, choiceNum, pathMemory):
    while choiceNum >= len(classList[classNum]) - 1:
        # when all possibilities in on class have exhausted, retract one class
        # explore the next possibilities in the nearest possible class
        # reset the memory path forward to zero
        # print("in the retract",len(classList[classNum]),choiceNum)
        classNum -= 1
        if classNum < 0:
            print("no more matches")
            return classList, classNum, choiceNum, pathMemory, True
        choiceNum = pathMemory[classNum]
        # print(pathMemory)
        # reset the next memory
        for i in range(classNum + 1, len(pathMemory)):
            pathMemory[i] = 0
    return classList, classNum, choiceNum, pathMemory, False


def checkTimeConflict(timeTable: List, date: List, timeBlock: List):
    """
    compare the new class to see if it has conflicts with the existing time table
    :param timeTable: the existing timeTable implemented using stack
    :param date: contains the date when the class takes place
    :param timeBlock: contains beginTime and endTime of a class
    :return:
    """
    if date == None or None in timeBlock:
        # do not include any TBA
        return True
    if not timeTable:
        return False

    beginTime = timeBlock[0]
    endTime = timeBlock[1]
    for times in timeTable:
        # print("debug 2", times)
        # input()

        dates = times[0]
        begin = times[1][0]
        end = times[1][1]
        for d in date:
            if d not in dates:
                continue
            if (begin <= beginTime <= end or begin <= endTime <= end):
                return True
    return False


def parseTime(classTime: str):
    """
    parse the classTime and return which day the class is on and what time it takes place
    remark: all time are calculated in minute form, starting at 0 and end at 24 * 60
    :param classTime: give the class time in form of String
    :return: date: List, timeBlock: List
    """
    if classTime == "TBA":
        # there is TBA
        return None, None

    pattern = r"([A-Za-z]*)\s([0-9]+.*)"
    parser = re.compile(pattern)
    match = parser.match(classTime)

    dates = match.group(1)
    times = match.group(2)

    date = []
    for i in range(0, len(dates), 2):
        date.append(dates[i:i + 2])

    time = times.strip().split("-")
    timeBlock = [0, 0]
    for count, i in enumerate(time):
        if "12" and "PM" in i:
            tempTime = i.strip().strip("PM").split(":")
            timeBlock[count] += int(tempTime[0]) * 60 + int(tempTime[1])
        elif "AM" in i:
            tempTime = i.strip().strip("AM").split(":")
            timeBlock[count] += int(tempTime[0]) * 60 + int(tempTime[1])
        elif "PM" in i:
            tempTime = i.strip().strip("PM").split(":")
            timeBlock[count] += (int(tempTime[0]) + 12) * 60 + int(tempTime[1])

    return date, timeBlock


readData()

if __name__ == "__main__":
    for choices in DICT["CS2110"]:
        print(choices)
