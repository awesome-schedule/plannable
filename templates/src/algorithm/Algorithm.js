import { AllRecords, CourseRecord, Course } from '../models/CourseRecord';
import Schedule from '../models/Schedule';

class InstantiateAlgo{
    constructor(raw_data,keys){
        this.AllRecords = new AllRecords(raw_data)

    }
}


class Algorithm{
    
    constructor(AllRecords){
        this.AllRecords = AllRecords
    }

    createSchedule(classList){
        /*I need a three dimensional array containing only days*/
        /*convert a day and a time into an integer --> day * 1440 + hr *60 + min * 1 
        classList --> [(keys,start,end)]*/
        var classNum = 0
        var choiceNum = 0
        var pathMem = Array.from({length: classList.length}, (x, i) => 0);
        var timeTable = new Array()
        var tempTable = new Array()
        var finalTable = new FinalTable()
        while(true){
            if(classNum >= length(classList)){
                finalTable.add(tempTable)
                classNum -= 1
                choiceNum = pathMem[classNum]
                timeTable.pop()
                tempTable.pop()
            }
        
            classNum, choiceNum, pathMemory, timeTable,tempTable, exhausted = AlgorithmRetract(classList,
                classNum,
                choiceNum,
                pathMemory,
                timeTable,
                tempTable)
            
            if(exhausted){
                break
            }

            timeBlock = classList[classNum][choiceNum].slice(1,3)

            if(!checkTimeConflict(timeTable, timeBlock)){
                //if the schedule matches, record the next path memory and go to the next class, reset the choiceNum = 0
                timeTable.push(timeBlock)
                tempTable.push([classList[classNum][choiceNum][0],choiceNum])
                pathMemory[classNum] = choiceNum + 1
                classNum += 1
                choiceNum = 0
            }
            else{
                choiceNum += 1
            }
        }
        return finalTable

    }

    AlgorithmRetract(classNum, choiceNum, pathMemory, timeTable,tempTable){
    /*when all possibilities in on class have exhausted, retract one class
         explore the next possibilities in the nearest possible class
        reset the memory path forward to zero
        */
        while (choiceNum >= length(classList[classNum])){
            classNum -= 1
            if(classNum < 0){
                return classNum, choiceNum, pathMemory, timeTable,tempTable, True
            }
            timeTable.pop()
            tempTable.pop()
            choiceNum = pathMemory[classNum]
            for (i in range(classNum + 1, len(pathMemory))){
                pathMemory[i] = 0
            }
        }
        return classNum, choiceNum, pathMemory, timeTable,tempTable, False
    }

    checkTimeConflict(timeTable, timeBlock){
        /*
        compare the new class to see if it has conflicts with the existing time table
        :param timeTable: three entries: 1. the class serial number, 2. the date 3. the time
        :param date: contains the date when the class takes place
        :param timeBlock: contains beginTime and endTime of a class
        :return: Boolean type: true if it has conflict, else false
        */
        if(None in timeBlock){
            //do not include any TBA
            return True
        }
        if(timeTable === []){
            return False
        }
        beginTime = timeBlock[0]
        endTime = timeBlock[1]
        for(times in timeTable){
            begin = times[0]
            end = times[1]
            if((begin <= beginTime <= end || begin <= endTime <= end)){
                return True
            }  
        }
        return False
    }
}


class FinalTable{
    constructor(){
        this.finalTable = new Array()
    }
    add(timeTable){
        schedule = new Schedule(timeTable)
        this.finalTable.push(schedule)
    }
}
