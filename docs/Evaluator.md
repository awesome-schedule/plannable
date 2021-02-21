# Schedule Evaluator

## Add a Sort Option

Due to the modular design of ScheduleEvaluator, it is relatively easy to add a sort option. Steps are shown below.

1. In [src/algorithm/ScheduleGenerator.cpp](/src/algorithm/ScheduleGenerator.cpp), implement a sort function that takes in an index and returns a floating point number. Add that sort function to the array of function pointers `sortFunctions`.
2. Go to [src/store/filter.ts](/src/store/filter.ts) and find a variable called `defaultOptions`
3. Add an entry for your sort option. Make sure that the index of your new entry is the same as the index of your function in `sortFunctions`.
