/**
 * The use of data structure assumes that
 * 1. Each course has no more than 255 sections (uint8 for schedules)
 * 2. Each schedule has no more than 21845 meetings each week (uint16 for timeArray)
 * Additionally, only one set of schedules can be stored at a time, since all data are stored as global variables
*/

#include <algorithm>
#include <chrono>
#include <cstring>
#include <iostream>
#include <limits>
#include <random>
#include <vector>

using namespace std;

namespace ScheduleGenerator {

template <typename T>
inline T calcOverlap(T a, T b, T c, T d) {
    if (c > b || a > d) return -1;
    return min(b, d) - max(a, c);
}

struct Date {
    double start;
    double end;
};

enum SortMode {
    fallback = 0,
    combined = 1
};

struct SortOption {
    /** whether or not this option is enabled */
    bool enabled;
    /** whether to sort in reverse */
    bool reverse;
    /** a unique index for this sort option */
    int idx;
    /** the weight of this sort option, used by the combined sort mode only */
    float weight;
};

SortOption sortOptions[7];
int sortMode = SortMode::combined;

struct CoeffCache {
    float max, min;
    float* __restrict__ coeffs = NULL;
};

/** 
 * timeMatrix[i*tmSize+j] = walking distance between room i and j
 * this matrix will be passed into this module through pointer, so it is declared as const
 */
const int* __restrict__ timeMatrix = NULL;
/** side length of the timeMatrix */
int tmSize = 0;

int numCourses;
/**
 * array of schedules. Schedule i is stored at i*numCourse to (i+1)*numCourses
 * @note may not be full
 */
uint16_t* __restrict__ schedules = NULL;
/**
 * maximum capcity the schedules
 * @note scheduleLen / numCourses = max number of schedules
 **/
int scheduleLen = 0;

/**
 * the reference schedule for sort by similarity. Length=numCourses
*/
uint16_t* __restrict__ refSchedule = NULL;

/** 
 * coefficient cache for each sort option 
 */
CoeffCache sortCoeffCache[7];
/**
 * the indices of the sorted schedules, equals to argsort(coeffs)
 * */
int* __restrict__ indices = NULL;
/**
 * the coefficient array used when performing a sort
 */
float* __restrict__ coeffs = NULL;
/**
 * the cumulative length of the time arrays for each schedule.
 * offsets[i] is the start index of the time array of schedule `i` in `this.blocks`
 */
int* __restrict__ offsets = NULL;
/**
 * array of TimeArrays concatenated together
 */
uint16_t* __restrict__ blocks = NULL;
/**
 * number of schedules generated
 */
int count = 0;

/**
 * compute the variance of class times during the week
 *
 * returns a higher value when the class times are unbalanced
 */
float variance(int idx) {
    const auto* _blocks = blocks + offsets[idx];
    int sum = 0,
        sumSq = 0;
    for (int i = 0; i < 7; i++) {
        int classTime = 0;
        for (int j = _blocks[i], end = _blocks[i + 1]; j < end; j += 3) {
            classTime += _blocks[j + 1] - _blocks[j];
        }
        sum += classTime;
        sumSq += classTime * classTime;
    }
    float mean = sum / 5.0f;
    return sumSq / 5.0f - mean * mean;
};

/**
 * compute the vertical compactness of a schedule,
 * defined as the total time in between each pair of consecutive classes
 *
 * The greater the time gap between classes, the greater the return value will be
 */
float compactness(int idx) {
    const auto* _blocks = blocks + offsets[idx];
    int compact = 0;
    for (int i = 0; i < 7; i++) {
        for (int j = _blocks[i], end = _blocks[i + 1] - 5; j < end; j += 3) {
            compact += _blocks[j + 3] - _blocks[j + 1];
        }
    }
    return compact;
};

/**
 * compute overlap of the classes and the lunch time,
 * defined as the time between 11:00 and 14:00
 *
 * The greater the overlap, the greater the return value will be
 */
float lunchTime(int idx) {
    const auto* _blocks = blocks + offsets[idx];
    // 11:00 to 14:00
    int totalOverlap = 0;
    for (int i = 0; i < 7; i++) {
        int dayOverlap = 0;
        for (int j = _blocks[i], end = _blocks[i + 1]; j < end; j += 3) {
            // 11:00 to 14:00
            dayOverlap += calcOverlap((int16_t)660, (int16_t)840, (int16_t)_blocks[j], (int16_t)_blocks[j + 1]);
        }

        if (dayOverlap > 60) totalOverlap += dayOverlap;
    }
    return totalOverlap;
};

/**
 * calculate the time between the start time of the earliest class and 12:00
 *
 * For a schedule that has earlier classes, this method will return a higher number
 */
float noEarly(int idx) {
    const auto* _blocks = blocks + offsets[idx];
    int refTime = 12 * 60;
    int total = 0;
    for (int i = 0; i < 7; i++) {
        int start = _blocks[i],
            end = _blocks[i + 1];
        if (end > start) {
            // if this day is not empty
            int time = _blocks[start];
            int temp = max(refTime - time, 0);
            total += temp * temp;
        }
    }
    return total;
}

/**
 * compute the sum of walking distances between each consecutive pair of classes
 */
float distance(int idx) {
    const auto* _blocks = blocks + offsets[idx];
    // timeMatrix is actually a flattened matrix, so matrix[i][j] = matrix[i*len+j]
    int dist = 0;
    for (int i = 0; i < 7; i++) {
        for (int j = _blocks[i], end = _blocks[i + 1] - 5; j < end; j += 3) {
            // does not count the distance of the gap between two classes is greater than 45 minutes
            if (_blocks[j + 3] - _blocks[j + 1] < 45) {
                auto r1 = _blocks[j + 2],
                     r2 = _blocks[j + 5];

                // skip unknown buildings
                if (r1 != (uint16_t)65535 && r2 != (uint16_t)65535) dist += timeMatrix[r1 * tmSize + r2];
            }
        }
    }
    return dist;
}

float similarity(int idx) {
    int sum = numCourses;
    const auto* curSchedule = schedules + idx * numCourses;
    for (int j = 0; j < numCourses; j++)
        sum -= (refSchedule[j] == curSchedule[j]);
    return sum;
}

// just used for a place holder, will never be called
float IamFeelingLucky(int idx) {
    return 1.0;
}

float (*sortFunctions[])(int idx) = {
    distance,
    variance,
    compactness,
    lunchTime,
    noEarly,
    similarity,
    IamFeelingLucky  // placeholder
    // can add more sort functions here
};

#ifdef DEBUG_LOG
const char* sortFunctionNames[] = {
    "distance",
    "variance",
    "compactness",
    "lunchTime",
    "noEarly",
    "similarity"};
#endif

/**
 * whether the random sort option is enabled
 */
bool isRandom() {
    for (auto& opt : sortOptions) {
        if (opt.idx == 6 && opt.enabled) return true;
    }
    return false;
}

/**
 * compute the coefficient array for a specific sorting option.
 * if it exists (i.e. already computed), don't do anything
 * @param funcIdx the index of the sorting option
 * @param assign whether assign to the values to `coeffs`
 * @returns the computed/cached coefficients
 */
CoeffCache computeCoeffFor(int funcIdx, bool assign) {
    auto& cache = sortCoeffCache[funcIdx];
    if (cache.coeffs != NULL) {
        if (assign) memcpy(coeffs, cache.coeffs, count * sizeof(float));
        return cache;
    } else {
        auto* __restrict__ newCache = new float[count];
        float max = -std::numeric_limits<float>::infinity(),
              min = std::numeric_limits<float>::infinity();
        auto evalFunc = sortFunctions[funcIdx];
        for (int i = 0; i < count; i++) {
            float val = (newCache[i] = evalFunc(i));
            if (val > max) max = val;
            if (val < min) min = val;
        }
        if (assign) memcpy(coeffs, newCache, count * sizeof(float));
        return (sortCoeffCache[funcIdx] = {max, min, newCache});
    }
}

/**
 * pre-compute the coefficient for each schedule using each enabled sorting function
 * so that they don't need to be computed on the fly when sorting
 */
void computeCoeff(int enabled, int lastIdx) {
    // if there's only one option enabled, just compute coefficients for it and
    // assign to the .coeff field for each schedule
    if (enabled == 1) {
        computeCoeffFor(lastIdx, true);
        return;
    }

    if (sortMode == SortMode::fallback) {
        for (auto option : sortOptions) {
            if (option.enabled)
                computeCoeffFor(option.idx, false);
        }
    } else {
        memset(coeffs, 0, count * sizeof(float));
        for (auto& option : sortOptions) {
            if (!option.enabled) continue;

            const auto& cache = computeCoeffFor(option.idx, false);

            float max = cache.max, min = cache.min;
            float range = max - min;
            // if all of the values are the same, skip this sorting coefficient
            if (range == 0.0) {
                continue;
            }

            float normalizeRatio = 1 / range,
                  weight = option.weight;
            auto coeff = cache.coeffs;
            // use Euclidean distance to combine multiple sorting coefficients
            if (option.reverse) {
                for (int i = 0; i < count; i++) {
                    float val = (max - coeff[i]) * normalizeRatio;
                    coeffs[i] += weight * val * val;
                }
            } else {
                for (int i = 0; i < count; i++) {
                    float val = (coeff[i] - min) * normalizeRatio;
                    coeffs[i] += weight * val * val;
                }
            }
        }
    }
}

extern "C" {

/**
 * initialize the global indices, offsets and blocks array so the sort function can use then
*/
void addToEval(const uint16_t* __restrict__ timeArray, const int* __restrict__ sectionLens) {
    int offset = 0;
    // point to the second part of the timeArray where the content is stored
    // should not alias with timeArray, which should be only used to access the first part
    const auto* __restrict__ timeArrayContent = timeArray + (sectionLens[numCourses]) * 8;
    const auto* __restrict__ curSchedule = schedules;
    // store the time and room information corresponding to curSchedule
    auto* __restrict__ curBlock = blocks;
    for (int i = 0; i < count; i++) {  // for each schedule
        int bound = 8;
        for (int j = 0; j < 7; j++) {  // sort the time blocks in order for each day
            // start index of day j in curBlock
            int s1 = (curBlock[j] = bound);

            // for each section selected (for each course), extract its time blocks on day j,
            // and insert into day j of curBlock
            for (int k = 0; k < numCourses; k++) {
                // offset of the time arrays
                int _off = curSchedule[k] * 8 + j;
                // insertion sort, fast for small arrays
                for (int n = timeArray[_off], e2 = timeArray[_off + 1]; n < e2; n += 3, bound += 3) {
                    int p = s1;
                    uint16_t vToBeInserted = timeArrayContent[n];
                    for (; p < bound; p += 3) {
                        if (vToBeInserted < curBlock[p]) break;
                    }
                    // move elements 3 slots toward the end
                    for (int m = bound - 1; m >= p; m--) curBlock[m + 3] = curBlock[m];
                    // insert three elements at p
                    curBlock[p] = timeArrayContent[n];
                    curBlock[p + 1] = timeArrayContent[n + 1];
                    curBlock[p + 2] = timeArrayContent[n + 2];
                    // TODO: bulk move
                    // *((TimeEntry*)&timeArrayContent[n]) = *((TimeEntry*)&curBlock[p]);
                }
            }
        }
        indices[i] = i;
        // record the current offset
        offsets[i] = offset;
        offset += curBlock[7] = bound;
        // goto the next schedule
        curBlock += bound;
        curSchedule += numCourses;
    }
}
/**
 * @param _numCourses number of courses
 * @param sectionLens a prefix array that stores the number of sections in each course
 * sectionLens[i] is the total number of sections in courses 0 to i - 1 inclusive
 * sectionLens[numCourses] is the total number of sections 
 * @param conflictCache the conflict cache matrix which caches the conflict between each pair of sections.
 * To check whether section i conflicts with section j: conflictCache[i * numSections + j] (or conflictCache[j * numSections + i])
 * Can do bitpacking, but no performance improvement observed
 * @param timeArray TODO: add description.
 * @note the pointers passed in to this function should point to dynamically allocated memory. They will be freed before this function returns. 
 * @returns the number of schedules generated. Returns -1 on memory allocation failure
 */
int generate(const int _numCourses, int maxNumSchedules, const int* __restrict__ sectionLens, const uint8_t* __restrict__ conflictCache, const uint16_t* __restrict__ timeArray) {
    numCourses = _numCourses;
    maxNumSchedules *= numCourses;
    if (maxNumSchedules + numCourses > scheduleLen) {
        // extra 1x numCourses to prevent write out of bound at computeSchedules at *!*!*
        scheduleLen = maxNumSchedules + numCourses;
        auto* newMem = (uint16_t*)realloc(schedules, scheduleLen * 2);
        // handle allocation failure
        if (newMem == NULL) return -1;
        schedules = newMem;
    }

    /** the total length of the time array that we need to allocate for schedules generated */
    int timeLen = 0;
    /** current course index */
    int courseIdx = 0;
    /** the index of the current section */
    int sectionIdx = 0;
    /** pointer to the current schedule */
    auto* curSchedule = schedules;
    int numSections = sectionLens[numCourses];
    while (true) {
        if (courseIdx >= numCourses) {  // we have finished building the current schedule
            // accumulate the length of the time arrays combined in each schedule
            // and copy the current schedule to next schedule
            auto* nextSchedule = curSchedule + numCourses;
            for (int i = 0; i < numCourses; i++) {
                int secIdx = (nextSchedule[i] = curSchedule[i]);  // *!*!*
                int _off = secIdx * 8;
                timeLen += timeArray[_off + 7] - timeArray[_off];
            }

            curSchedule = nextSchedule;
            if (curSchedule - schedules >= maxNumSchedules) goto end;
            sectionIdx = curSchedule[--courseIdx] + 1;
        }
next:;
        /**
         * when all possibilities in on class have exhausted, explore the next possibility in the previous class
         * reset choices of the later classes to 0
         */
        while (sectionIdx >= sectionLens[courseIdx + 1]) {
            // return to the previous class
            // if all possibilities are exhausted, break out the loop
            if (--courseIdx < 0) goto end;

            // explore the next possibility
            sectionIdx = curSchedule[courseIdx] + 1;
            for (int i = courseIdx + 1; i < numCourses; i++) curSchedule[i] = 0;
        }

        // check conflict between the newly chosen section and the sections already in the schedule
        int temp = sectionIdx * numSections;
        for (int i = 0; i < courseIdx; i++) {
            if (conflictCache[temp + curSchedule[i]]) {
                // if conflict, increment the section index
                ++sectionIdx;
                goto next;
            }
        }

        // if the section does not conflict with any previously chosen sections, 
        // record the section and go to the next class, 
        curSchedule[courseIdx++] = sectionIdx;
        // set choice num to be the first section of the next class
        sectionIdx = sectionLens[courseIdx];
    }
end:;
    count = (curSchedule - schedules) / numCourses;
    timeLen += 8 * count;

    /**
     * backing storage for indices, coeffs, offsets and blocks
     */
    static void* evalMem = NULL;
    /**
     * length of the evalMem in bytes
     */
    static uint32_t memSize = 0;

    // handle reallocation of memory
    uint32_t newMemSize = (uint32_t)(count)*3 * 4 + (uint32_t)(timeLen)*2;
    if (newMemSize > memSize) {
        void* newMem = realloc(evalMem, newMemSize);
        if (newMem == NULL) return -1;
        evalMem = newMem;
        memSize = newMemSize;
        indices = (int*)evalMem;
        coeffs = ((float*)evalMem) + count;
        offsets = ((int*)evalMem) + 2 * count;
        blocks = ((uint16_t*)evalMem) + 6 * count;
    }

    addToEval(timeArray, sectionLens);

// cleanup
#ifndef _TEST
    free((void*)sectionLens);
    free((void*)conflictCache);
    free((void*)timeArray);
#endif
    for (auto& cache : sortCoeffCache) {
        if (cache.coeffs != NULL) {
            delete[] cache.coeffs;
            cache.coeffs = NULL;
        }
    }
    return count;
}

/**
 * sort the array of schedules according to their quality coefficients which will be computed by `computeCoeff`
 */
void sort() {
    if (isRandom()) {
        default_random_engine eng;
        shuffle(indices, indices + count, eng);
        return;
    }

    static SortOption enabledOptions[7];

    int enabled = 0;
    int lastIdx = -1;
    for (int i = 0; i < 7; i++) {
        auto& option = sortOptions[i];
        if (option.enabled) {
            enabledOptions[enabled++] = option;
            lastIdx = option.idx;
        }
    }
    if (enabled == 0) return;
    computeCoeff(enabled, lastIdx);

    if (sortMode == SortMode::combined || enabled == 1) {
        /**
         * The comparator function used:
         *
         * if only one option is enabled, the sort direction depends on the `reversed` property of it
         *
         * if multiple sort options are enabled and the sort mode is combined, the `computeCoeff` method
         * will take care of the sort direction of each function, so we sort in ascending order anyway
         */
        auto cmpFunc =
            enabledOptions[0].reverse && enabled == 1
                ? [](int a, int b) { return coeffs[b] < coeffs[a]; }   // descending
                : [](int a, int b) { return coeffs[a] < coeffs[b]; };  // ascending
        if (count > 1000) {
            std::partial_sort(indices, indices + 1000, indices + count, cmpFunc);
        } else {
            std::sort(indices, indices + count, cmpFunc);
        }
    } else {
        struct {
            float rev;
            float* coeffs;
        } data[enabled];
        // if option[i] is reverse, ifReverse[i] will be -1 * weight
        // cached array of coefficients for each enabled sort function
        for (int i = 0; i < enabled; i++) {
            data[i].rev = enabledOptions[i].reverse ? -1.0f : 1.0f;
            data[i].coeffs = sortCoeffCache[enabledOptions[i].idx].coeffs;
        }
        auto func = [enabled, &data](int a, int b) {
            float r = 0;
            for (int i = 0; i < enabled; i++) {
                // calculate the difference in coefficients
                r = data[i].rev * (data[i].coeffs[a] - data[i].coeffs[b]);

                // if non-zero, returns this coefficient
                if (r != 0.0) return r < 0;

                // otherwise, fallback to the next sort option
            }
            return r < 0;
        };
        if (count > 1000) {
            std::partial_sort(indices, indices + 1000, indices + count, func);
        } else {
            std::sort(indices, indices + count, func);
        }
    }
}

void setSortMode(int mode) {
    sortMode = mode;
}

void setSortOption(int i, int enabled, int reverse, int idx, float weight) {
    sortOptions[i] = {(bool)enabled, (bool)reverse, idx, weight};
}

void setTimeMatrix(int* ptr, int sideLen) {
    if (timeMatrix != NULL) delete[] timeMatrix;
    timeMatrix = ptr;
    tmSize = sideLen;
}

int size() {
    return count;
}

uint16_t* getSchedule(int idx) {
    return schedules + indices[idx] * numCourses;
}

float getRange(int idx) {
    return sortCoeffCache[idx].max - sortCoeffCache[idx].min;
}

void setRefSchedule(uint16_t* ref) {
    if (refSchedule != NULL) free(refSchedule);
    refSchedule = ref;
    auto& cache = sortCoeffCache[5];
    if (cache.coeffs != NULL) {
        delete[] cache.coeffs;
        cache.coeffs = NULL;
    }
}
}

}  // namespace ScheduleGenerator
#ifdef _TEST
int main() {
    using namespace ScheduleGenerator;
    uint16_t timeArray[] = {
        32, 32, 35, 35, 38, 38, 38, 38,
        38, 38, 41, 41, 44, 44, 44, 44,
        44, 44, 47, 47, 50, 50, 50, 50,
        50, 50, 53, 53, 56, 56, 56, 56,
        240, 300, (uint16_t)-1, 240, 300, (uint16_t)-1,
        0, 60, (uint16_t)-1, 0, 60, (uint16_t)-1,
        400, 460, (uint16_t)-1, 400, 460, (uint16_t)-1,
        120, 180, (uint16_t)-1, 120, 180, (uint16_t)-1};
    for (int i = 0; i < 4 * 8; i++) {
        timeArray[i] -= 32;
    }

    uint8_t conflict[16] = {0};
    conflict[0 + 1] = 1;
    conflict[2] = 1;
    int secLens[3] = {0, 2, 4};
    ScheduleGenerator::generate(2, 10, secLens, conflict, timeArray);
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 2; j++) {
            cout << (int)schedules[i * 2 + j] << ",";
        }
        cout << endl;
    }
    cout << ScheduleGenerator::count << endl;
    for (int i = 0; i < (8 + 12) * 4; i++) {
        cout << blocks[i] << ",";
        /* code */
    }
    cout << endl;
}
#endif