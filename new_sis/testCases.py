import time
import random
t1 = time.clock()
import classAlgo
print(len(classAlgo.DICT))
t2 = time.clock()
print(t2 - t1)

def generateTestCases(classNumber=2):
    # not efficient
    file = open("CompSci_classTitle.csv")
    info = file.read().strip().split("\n")
    courseNames = set()
    while len(courseNames) < classNumber:
        index = random.randint(0,len(info)-1)
        courseNames.add(info[index])

    classList = []
    for theClass in courseNames:
        classList.append(classAlgo.DICT[theClass])
    for i in range(len(classList)):
        print(classList[i][0][9],classList[i][0][7])
    return classList

def callAlgorithm():
    for i in range(1000):
        print("start")
        classList = generateTestCases()
        classAlgo.Algorithm(classList)

callAlgorithm()

#Thesis,Defense Against the Dark Arts

"""what has been done:
1. parser good
2. Algorithm seems like no bug
3. have a algorithm retract function
4. started the test cases file
5. programming bug seems to be solved

what need to be done
1. a real comparison test
2. problem: I realized there could be the same name for different category subjects 
such as "Thesis" "Independent Study". Need to better store the data

"""
