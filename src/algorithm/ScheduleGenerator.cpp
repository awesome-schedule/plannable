#include <algorithm>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <limits>
#include <random>
#include <vector>

using namespace std;

// struct TimeEntry {
//     int16_t start;
//     int16_t end;
//     int16_t room;
// };

// union TimeArray {
//     int16_t data[];
//     struct {
//         int16_t offsets[8];
//         TimeEntry entries[];
//     } entries;
//     inline int16_t operator[](int i) {
//         return data[i];
//     }
// };

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

int* __restrict__ timeMatrix = NULL;
/** size length of the timeMatrix */
int tmSize = 0;

int numCourses;
uint8_t* __restrict__ allChoices = NULL;
int allChoiceLen = 0;

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
int16_t* __restrict__ blocks = NULL;
/**
 * number of schedules generated
 */
int count = 0;
/**
 * length of blocks
 */
int blockLen = 0;

/**
 * compute the variance of class times during the week
 *
 * returns a higher value when the class times are unbalanced
 */
float variance(int idx) {
    int offset = offsets[idx];
    int sum = 0,
        sumSq = 0;
    int oEnd = offset + 7;
    for (int i = offset; i < oEnd; i++) {
        int end = offset + blocks[i + 1];
        int classTime = 0;
        for (int j = blocks[i] + offset; j < end; j += 3) {
            classTime += blocks[j + 1] - blocks[j];
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
    int offset = offsets[idx];
    int compact = 0;
    int oEnd = offset + 7;
    for (int i = offset; i < oEnd; i++) {
        int end = offset + blocks[i + 1] - 5;
        for (int j = blocks[i] + offset; j < end; j += 3) {
            compact += blocks[j + 3] - blocks[j + 1];
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
    int offset = offsets[idx];
    // 11:00 to 14:00
    int totalOverlap = 0;
    int oEnd = offset + 7;
    for (int i = offset; i < oEnd; i++) {
        int end = blocks[i + 1] + offset;
        int dayOverlap = 0;
        for (int j = blocks[i] + offset; j < end; j += 3) {
            // 11:00 to 14:00
            dayOverlap += calcOverlap((int16_t)660, (int16_t)840, blocks[j], blocks[j + 1]);
        }

        if (dayOverlap > 60) totalOverlap += dayOverlap;
    }
    return totalOverlap;
};

/**
 * calculate the time between the start time of the earliest class and 22:00
 *
 * For a schedule that has earlier classes, this method will return a higher number
 */
float noEarly(int idx) {
    int offset = offsets[idx];
    int refTime = 12 * 60,
        oEnd = offset + 7;
    int total = 0;
    for (int i = offset; i < oEnd; i++) {
        int start = blocks[i],
            end = blocks[i + 1];
        if (end > start) {
            // if this day is not empty
            int time = blocks[start + offset];
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
    int offset = offsets[idx];
    // timeMatrix is actually a flattened matrix, so matrix[i][j] = matrix[i*len+j]
    int oEnd = offset + 7;
    int dist = 0;
    for (int i = offset; i < oEnd; i++) {
        int end = blocks[i + 1] + offset - 5;
        for (int j = blocks[i] + offset; j < end; j += 3) {
            // does not count the distance of the gap between two classes is greater than 45 minutes
            if (blocks[j + 3] - blocks[j + 1] < 45) {
                auto r1 = blocks[j + 2],
                     r2 = blocks[j + 5];

                // skip unknown buildings
                if (r1 < 0 || r2 < 0) cout << "!!" << r1 << "!" << r2 << endl;
                if (r1 != -1 && r2 != -1) dist += timeMatrix[r1 * tmSize + r2];
            }
        }
    }
    return dist;
}

float similarity(int idx) {
    return 0.0;
}

/**
 * the return value is not used. If this sort option is enabled, `shuffle` is called.
 */
float IamFeelingLucky() {
    return 0.0;
}

float (*sortFunctions[])(int idx) = {
    distance,
    variance,
    compactness,
    lunchTime,
    noEarly,
    similarity};

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
        cout << "func count " << tmSize << endl;
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

void addToEval(const int32_t* __restrict__ timeArray, int maxLen) {
    int offset = 0;
    auto* __restrict__ _allChoices = allChoices;
    auto* __restrict__ _blocks = blocks;
    for (int i = 0; i < count; i++) {
        // sort the time blocks in order
        int bound = 8;  // size does not contain offset
        // no offset in j because arr2 also needs it
        for (int j = 0; j < 7; j++) {
            // start of the current day
            int s1 = (_blocks[j] = bound);
            for (int k = 0; k < numCourses; k++) {
                // offset of the time arrays
                int _off = ((k * maxLen + _allChoices[k]) << 3) + j;
                // insertion sort, fast for small arrays
                for (int n = timeArray[_off], e2 = timeArray[_off + 1]; n < e2; n += 3, bound += 3) {
                    // p already contains offset
                    int p = s1;
                    int16_t vToBeInserted = timeArray[n];
                    for (; p < bound; p += 3) {
                        if (vToBeInserted < _blocks[p]) break;
                    }
                    // move elements 3 slots toward the end
                    // same as `_blocks.copyWithin(p + 3, p, realBound);`, but faster
                    for (int m = bound - 1; m >= p; m--) _blocks[m + 3] = _blocks[m];
                    // insert three elements at p
                    _blocks[p] = vToBeInserted;
                    _blocks[p + 1] = timeArray[n + 1];
                    _blocks[p + 2] = timeArray[n + 2];
                    if (_blocks[p] < -1) cout << "p1!!!!" << timeArray[n] << endl;
                    if (_blocks[p + 1] < -1) cout << "p2!!!!" << timeArray[n + 1] << endl;
                    if (_blocks[p + 2] < -1) cout << "p3!!!!" << timeArray[n + 2] << endl;
                }
            }
        }
        // record the current offset
        offsets[i] = offset;
        offset += _blocks[7] = bound;
        _blocks += bound;
        _allChoices += numCourses;
    }
}

int generate(int _numCourses, int maxNumSchedules, const uint8_t* __restrict__ sectionLens, const uint8_t* __restrict__ conflictCache, const int32_t* __restrict__ timeArray) {
    numCourses = _numCourses;
    int maxLen = *max_element(sectionLens, sectionLens + numCourses);
    int sideLen = numCourses * maxLen;
    // cout << "sideLen " << sideLen << endl;

    maxNumSchedules *= numCourses;
    if (maxNumSchedules + numCourses > allChoiceLen) {
        allChoiceLen = maxNumSchedules + numCourses;
        allChoices = (uint8_t*)realloc(allChoices, allChoiceLen);
    }

    /**  the total length of the time array that we need to allocate for schedules generated */
    int timeLen = 0;
    /** current course index */
    int classNum = 0;
    /** the index of the section of the current course */
    int choiceNum = 0;
    /**
     * the total number of schedules already generated multiplied by numCourses
     * serve as the base pointer for current schedule in the allChoices array
     */
    int base = 0;
    while (true) {
        if (classNum >= numCourses) {
            // accumulate the length of the time arrays combined in each schedule
            // and copy the current schedule to next schedule
            int newBase = base + numCourses;
            for (int i = 0; i < numCourses; i++) {
                int secIdx = (allChoices[newBase + i] = allChoices[base + i]);
                int _off = i * maxLen * 8 + secIdx * 8;
                timeLen += timeArray[_off + 7] - timeArray[_off];
            }

            base = newBase;
            if (base >= maxNumSchedules) goto end;
            choiceNum = allChoices[base + --classNum] + 1;
        }

        /**
         * when all possibilities in on class have exhausted, retract one class
         * explore the next possibilities in the previous class
         * reset the memory path forward to zero
         */
        while (choiceNum >= sectionLens[classNum]) {
            // if all possibilities are exhausted, break out the loop
            if (--classNum < 0) goto end;

            choiceNum = allChoices[base + classNum] + 1;
            for (int i = classNum + 1; i < numCourses; i++) allChoices[base + i] = 0;
        }

        // check conflict between the newly chosen section and the sections already in the schedule
        int temp = (choiceNum * numCourses + classNum) * sideLen;
        for (int i = 0; i < classNum; i++) {
            int idx = temp + i + allChoices[base + i] * numCourses;
            if (conflictCache[idx]) {
                ++choiceNum;
                goto outer;
            }
        }

        // if the section does not conflict with any previously chosen sections,
        // increment the path memory and go to the next class, reset the choiceNum = 0
        allChoices[base + classNum++] = choiceNum;
        choiceNum = 0;
    outer:;
    }
end:;
    delete[] conflictCache;
    delete[] timeArray;

    for (auto& cache : sortCoeffCache) {
        if (cache.coeffs != NULL) {
            delete[] cache.coeffs;
            cache.coeffs = NULL;
        }
    }

    int _count = base / numCourses;
    timeLen += 8 * _count;
    // handle reallocation of memory
    if (_count > count) {
        indices = (int*)realloc(indices, _count * sizeof(int));
        // for (int i = 0; i < _count; i++) indices[i] = i;
        coeffs = (float*)realloc(coeffs, _count * sizeof(float));
        offsets = (int*)realloc(offsets, _count * sizeof(int));
    }
    if (timeLen > blockLen) {
        blocks = (int16_t*)realloc(blocks, timeLen * 2);
    }

    // static void* mem = NULL;
    // free(mem);
    // mem = malloc(_count * 3 * sizeof(int) + timeLen * 2);
    // indices = (int*)mem;
    // coeffs = ((float*)mem) + _count;
    // offsets = ((int*)mem) + 2 * _count;
    // blocks = ((int16_t*)mem) + 6 * _count;

    // cout << "blockLen " << blockLen << endl;
    // for (int i = 0; i < numCourses; i++) {
    //     cout << (int)allChoices[i] << ",";
    // }
    // cout << endl;

    count = _count;
    blockLen = timeLen;

    addToEval(timeArray, maxLen);
    return count;
}

/**
 * sort the array of schedules according to their quality coefficients which will be computed by `computeCoeff`
 */
void sort() {
    for (int i = 0; i < count; i++) indices[i] = i;

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
         * if multiple sort options are enabled and the sort mode is combined, which means
         * `(!isCombined || enabled === 1)` is false, the `computeCoeff` method
         * is already taken care of the sort direction of each function, so we sort in ascending order anyway
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

uint8_t* getSchedule(int idx) {
    return allChoices + indices[idx] * numCourses;
}

float getRange(int idx) {
    return sortCoeffCache[idx].max - sortCoeffCache[idx].min;
}
}

}  // namespace ScheduleGenerator