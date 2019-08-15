# Algorithm and Data Structure

This page discusses the data structures and optimizations involved in schedule generation and evaluation

## Introduction

A schedule is nothing more than an array of sections, one from each course. The number of possible schedules in total is the product of the number of sections in each course. With this many possibilities, it is important to optimize the ScheduleGenerator and ScheduleEvaluator so we can efficiently generate and sort these schedules

## Schedule Generation

### Algorithm Bootstrap

Before generating schedules, we first need to gather the candidate sections for each course. Because courses have different number of sections, the data structure for storing these sections is an array of arrays. The sections occurring at the same time are combined to reduce the total number of sections.

Each combined section is a tuple of the course key and the array of section ids that occur at the same time.

```js
const classList = [
    [['cs11105', [11156]], ['cs11105', [12333]], ['cs11105', [10583]]], // course 1
    [['enwr15105', [11346, 12525]], ['enwr15105', [23512, 11001]]], // course 2
    [...], // course 3
];
/**
 * example: sec1 is the second section of the second course
 */
const sec1 = classList[1][1]; // ['enwr15105', [23512, 11001]
```

Then, we need to gather the meeting time for these sections, as we will make sure that none of the sections in a schedule conflict with each other. Therefore, we create a variable called `timeArrList` that has one-to-one correspondence with the combined sections stored in the `classList`. The time representation of each section is discussed below.

### Time and Room Representation

The meeting time of a section is given by the day and the time period when people meet. Because a week only has 7 days, prior to v7, we represent a week using a tuple of 7 arrays. In each array, we represent the start and end of a meeting as the number of minutes starting from 0:00, so 10:00 to 11:00 become `[600, 660]`. The room is converted to a number, which is an index in the array of all buildings. If there is no meeting at a given day, it is left empty. If there is more than 1 meeting per day, the start, end and room number of them are concatenated together.

Using this method, the representation of a section that meets at Monday, Wednesday, Friday 10:00 to 10:00 at room 12 and Monday 20:00 to 21:00 at room 43 is shown below.

<figure>
    <img src="./time_repr_old.svg">
    <figcaption>Time and Room Representation Prior to v7.0</figcaption>
</figure>

However, these is a lot of overhead in storing these small arrays, as the JS engine has to track a lot of meta data, e.g. element kinds, hidden class, length, etc. This memory overhead becomes especially important in ScheduleEvaluator, which we will see later. Also, it is common for one or more of these arrays to be empty, especially at index 6 and 7. A natural idea of optimization is to concatenate all of them together. Then, the problem is to figure out the line of separation for each day. Luckily, with the observation that the number of days in a week, 7, is always fixed, we came up with a solution.

<figure>
    <img src="./time_repr_new.svg">
    <figcaption>Time and Room Representation After v7.0</figcaption>
</figure>

We concatenate all these small arrays together, and we keep track of the start and end indices of each day using the first 8 values<sup>note 1</sup>. Monday is stored at range `arr[0]` to `arr[1]`, Tuesday is stored at range `arr[1]` to `arr[2]`, etc. If `arr[i]` is the same as `arr[i+1]`, that means day `i` is empty. Because each day only has 1440 minutes and probably no college has more than 32767 available buildings, we can store the entire array in int16, using `Int16Array`, which saves even more memory.

The code example that loops through each of the meeting is shown below.

```js
for (let i = 0; i < 7; i++) {
    const dayEnd = timeArr[i + 1];
    for (let j = timeArr[i]; j < dayEnd; j += 3) {
        const timeStart = timeArr[j],
            timeEnd = timeArr[j + 1],
            roomIdx = timeArr[j + 2];
        // do some processing
    }
}
```

### Time Conflict Cache

When developing version 7.0, we discovered that it is much more efficient to pre-compute the conflict between all pairs of sections in different courses than computing them on-the-fly.

#### Pre-computation

Assume there are `n` courses, and the maximum number of sections in each course is `m`. Then, when pre-computing the conflicts, the upper bound of pairs we need to considered is roughly `(n * m)^2 / 2`.

#### On-the-fly

We build each schedule incrementally. When we try a new section, the first thing we need to check is whether it conflicts with the sections already in the schedule, achieved by iterating through them and checking the newly chosen section with each of them. Thus, for each schedule, we need to check 1 + 2 + ... + n - 1 number of conflicts, which is `n (n - 1) / 2`. The upper bound for the number of schedules is `m^n`. Therefore, the on-the-fly method requires an upper bound of `(m ^ n) * n (n - 1) / 2` number of conflict calculations, which is usually much more than the number obtained in the previous section.

#### The Cache Tensor

The conflict cache is a 4d boolean tensor, stored as a `Uint8Array`.

```js
const conflictCache = new Uint8Array(buffer, byteOffset, sideLen ** 2);
```

The conflict between section1 of course1 and section2 of course2 is obtained by

```js
conflictCache[(section1 * numCourses + course1) * sideLen + (section2 * numCourses + course2)];
// like this: conflictCache[section1][course1][section2][course2]
```

where `sideLen = numCourses * maxNumOfSectionsInEachCourse`

### Main Loop

## Schedule Evaluation

### Pre-computing Coefficients

#### Sorting Time Blocks

#### Coefficient Cache

#### Sort
