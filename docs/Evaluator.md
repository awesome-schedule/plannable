# Schedule Evaluator

## Add a Sort Option

Due to the modular design of ScheduleEvaluator, it is relatively easy to add a sort option. Steps are shown below.

1. In the static member sortFunctions of [src/algorithm/ScheduleEvaluator](/src/algorithm/ScheduleEvaluator.ts), implement a sort function that takes in a offset into the time block and returns an integer or a floating point number. If your sort option requires additional parameters, you can pass your parameters to constructor of the `ScheduleEvaluator` and assign to `this`. You have access to `this` inside sort functions.
2. Go to [src/store/filter.ts](/src/store/filter.ts) and find a variable called `defaultOptions`
3. Add an entry for your sort option
