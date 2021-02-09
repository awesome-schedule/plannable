#include <glpk.h>

#include <algorithm>
#include <climits>
#include <cstdint>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int isTolerance = 0;
int ISMethod = 1;
int applyDFS = 1;
int dfsTolerance = 0;
int LPIters = 100;
int LPModel = 3;
int showFixed = 1;

struct ScheduleBlock {
    bool visited;
    bool isFixed;
    int16_t startMin;
    int16_t endMin;
    int16_t duration;
    int idx;
    int depth;
    int pathDepth;
    double left, width;
    vector<ScheduleBlock*> leftN;
    vector<ScheduleBlock*> rightN;
    vector<ScheduleBlock*> cleftN;
};

ScheduleBlock* blocks;
ScheduleBlock** blocksReordered;
// a working buffer for BFS/LP models, usually not full
ScheduleBlock** blockBuffer;
int* idxMap;
bool* matrix;

// --------- results -----------------
double r_sum;
double r_sumSq;
struct Position {
    double left, width;
} * r_positions;
bool* r_fixed;
// --------- results -----------------
int N = 0;

void setup(int _N) {
    if (_N > N) {
        // we need to allocate more memory
        if (N != 0) {
            delete[] blocks;
            delete[] blocksReordered;
            delete[] blockBuffer;
            delete[] idxMap;
            delete[] matrix;
            delete[] r_positions;
            delete[] r_fixed;
        }
        blocks = new ScheduleBlock[_N]();
        blocksReordered = new ScheduleBlock*[_N];
        blockBuffer = new ScheduleBlock*[_N];
        idxMap = new int[_N];
        matrix = new bool[_N * _N]();
        r_positions = new Position[_N];
        r_fixed = new bool[_N];
    } else {
        fill(matrix, matrix + _N * _N, false);
    }
    N = _N;
    r_sumSq = r_sum = 0.0;
}

void computeResult() {
    for (int i = 0; i < N; i++) {
        auto& block = blocks[i];
        r_positions[i].left = block.left;
        double w = r_positions[i].width = block.width;
        r_fixed[i] = block.isFixed;
        r_sum += w;
        r_sumSq += w * w;
    }
}

inline int calcOverlap(int a, int b, int c, int d) {
    if (a <= c && d <= b)
        return d - c;
    else if (c <= a && b <= d)
        return b - a;
    else if (a <= c && c <= b)
        return b - c;
    else if (a <= d && d <= b)
        return d - a;
    else
        return -1;
}

inline bool conflict(ScheduleBlock& b1, ScheduleBlock& b2, int tolerance) {
    return calcOverlap(b1.startMin, b1.endMin, b2.startMin, b2.endMin) >
           tolerance;
}

void sortByStartTime() {
    sort(blocksReordered, blocksReordered + N,
         [](ScheduleBlock* b1, ScheduleBlock* b2) {
             int diff = b1->startMin - b2->startMin;
             if (diff == 0) return b2->duration - b1->duration < 0;
             return diff < 0;
         });
}

int intervalScheduling() {
    if (N == 0) return 0;

    sortByStartTime();
    blockBuffer[0] = blocksReordered[0];  // occupied room
    int occupiedSize = 1;
    int numRooms = 0;
    for (int i = 1; i < N; i++) {
        auto block = blocksReordered[i];
        int idx = -1;
        int minRoomIdx = INT_MAX;
        for (int k = 0; k < occupiedSize; k++) {
            auto* prevBlock = blockBuffer[k];
            if (prevBlock->endMin <= block->startMin + isTolerance &&
                prevBlock->depth < minRoomIdx) {
                minRoomIdx = prevBlock->depth;
                idx = k;
            }
        }
        if (idx == -1) {
            numRooms += 1;
            block->depth = numRooms;
            blockBuffer[occupiedSize++] = block;
        } else {
            block->depth = blockBuffer[idx]->depth;
            blockBuffer[idx] = block;
        }
    }
    numRooms += 1;
    return numRooms;
}

int intervalScheduling2() {
    if (N == 0) return 0;

    sortByStartTime();
    // min heap, the top element is the room whose end time is minimal
    // a room is represented as a pair: [end time, room index]
    auto comp = [](ScheduleBlock* r1, ScheduleBlock* r2) {
        int diff = r1->endMin - r2->endMin;
        if (diff == 0) return r1->depth - r2->depth > 0;
        return diff > 0;
    };
    priority_queue<ScheduleBlock*, vector<ScheduleBlock*>, decltype(comp)>
        queue(comp);
    queue.push(blocksReordered[0]);

    int numRooms = 0;
    int tolerance = isTolerance;
    for (int i = 1; i < N; i++) {
        auto block = blocksReordered[i];
        auto prevBlock = queue.top();
        if (prevBlock->endMin + tolerance > block->startMin) {
            // conflict, need to add a new room
            numRooms += 1;
            block->depth = numRooms;
        } else {
            block->depth = prevBlock->depth;
            queue.pop();  // update the room end time
        }
        queue.push(block);
    }
    return numRooms + 1;
}

void constructAdjList() {
    // construct an undirected graph
    for (int i = 0; i < N; i++) {
        auto& bi = blocks[i];
        for (int j = i + 1; j < N; j++) {
            auto& bj = blocks[j];
            if (conflict(bi, bj, dfsTolerance)) {
                if (bi.depth < bj.depth) {
                    matrix[j * N + i] = 1;
                    bj.leftN.push_back(&bi);
                    bi.rightN.push_back(&bj);
                } else {
                    matrix[i * N + j] = 1;
                    bj.rightN.push_back(&bi);
                    bi.leftN.push_back(&bj);
                }
            }
        }
    }
}

int BFS(ScheduleBlock* start) {
    int qIdx = 0;
    int NC = 1;
    blockBuffer[0] = start;
    start->visited = true;
    while (qIdx < NC) {
        for (auto node : blockBuffer[qIdx]->leftN) {
            if (!node->visited) {
                node->visited = true;
                blockBuffer[NC++] = node;
            }
        }
        for (auto node : blockBuffer[qIdx]->rightN) {
            if (!node->visited) {
                node->visited = true;
                blockBuffer[NC++] = node;
            }
        }
        qIdx++;
    }
    return NC;
}

void depthFirstSearchRec(ScheduleBlock* start, int maxDepth) {
    start->visited = true;
    start->pathDepth = maxDepth;

    for (auto adj : start->leftN) {
        // we only visit nodes of lower depth
        if (!adj->visited) depthFirstSearchRec(adj, maxDepth);
    }
}

bool DFSFindFixed(ScheduleBlock* start) {
    start->visited = true;
    int startDepth = start->depth;
    if (startDepth == 0) return (start->isFixed = true);

    int pDepth = start->pathDepth;
    bool flag = false;
    for (auto adj : start->leftN) {
        // we only visit nodes next to the current node (depth different is
        // exactly 1) with the same pathDepth
        if (startDepth - adj->depth == 1 && pDepth == adj->pathDepth) {
            if (adj->visited) {
                flag = adj->isFixed || flag;
            } else {
                // be careful of the short-circuit evaluation
                flag = DFSFindFixed(adj) || flag;
            }
        }
    }
    return (start->isFixed = flag);
}

bool DFSFindFixedNumerical(ScheduleBlock* start) {
    start->visited = true;
    double startLeft = start->left;
    // equality here should be fine
    if (startLeft == 0.0) return (start->isFixed = true);

    bool flag = false;
    for (auto adj : start->leftN) {
        if (abs(startLeft - adj->left - adj->width) < 1e-8) {
            if (adj->visited) {
                flag = adj->isFixed || flag;
            } else {
                // be careful of the short-circuit evaluation
                flag = DFSFindFixedNumerical(adj) || flag;
            }
        }
    }
    return (start->isFixed = flag);
}

void calculateMaxDepth() {
    sort(blocksReordered, blocksReordered + N,
         [](ScheduleBlock* b1, ScheduleBlock* b2) {
             return b2->depth < b1->depth;
         });

    // We start from the node of the greatest depth and traverse to the lower
    // depths
    for (int i = 0; i < N; i++) {
        auto node = blocksReordered[i];
        if (!node->visited) depthFirstSearchRec(node, node->depth + 1);
    }
    auto* end = blocks + N;
    for (auto* node = blocks; node < end; node++) {
        node->visited = false;
    }
    for (int i = 0; i < N; i++) {
        auto node = blocksReordered[i];
        if (!node->visited && node->rightN.size() == 0) DFSFindFixed(node);
    }
}

struct Cons {
    int var1, var2;
    double var3;
};

vector<int> ia, ja;
vector<double> ar;

inline void addConstraint(int auxVar, int structVar, double coeff) {
    ia.push_back(auxVar);
    ja.push_back(structVar);
    ar.push_back(coeff);
}

template <typename T>
inline void clearAndReserve(vector<T>& vec) {
    size_t cap = vec.capacity();
    vec.clear();
    vec.reserve(cap);
}

void buildLPModel1(int NC) {
    for (int i = 0; i < NC; i++) {
        idxMap[blockBuffer[i]->idx] = 2 * i + 1;
    }
    glp_prob* lp = glp_create_prob();
    glp_set_obj_dir(lp, GLP_MAX);
    glp_add_cols(lp, NC * 2);

    clearAndReserve(ia);
    clearAndReserve(ja);
    clearAndReserve(ar);
    addConstraint(0, 0, 0.0);
    int auxVar = 1;
    for (int i = 0; i < NC; i++) {
        auto block = blockBuffer[i];
        double maxLeftFixed = 0.0;
        double minRight = 1.0;
        for (auto v : block->leftN)
            if (v->isFixed)
                maxLeftFixed = max(maxLeftFixed, v->left + v->width);
        // else
        //     cons.push_back({i + 1, idxMap[v->idx], 0.0});
        for (auto v : block->rightN)
            if (v->isFixed) minRight = min(v->left, minRight);

        int leftVar = 2 * i + 1;
        for (auto v : block->cleftN) {
            if (!v->isFixed) {
                // l >= leftL + width
                addConstraint(auxVar, leftVar, 1.0);
                addConstraint(auxVar, idxMap[v->idx], -1.0);
                addConstraint(auxVar, idxMap[v->idx] + 1, -1.0);
                glp_add_rows(lp, 1);
                glp_set_row_bnds(lp, auxVar++, GLP_LO, 0.0, 0.0);
            }
        }
        // l + width <= right
        addConstraint(auxVar, leftVar, 1.0);
        addConstraint(auxVar, leftVar + 1, 1.0);
        glp_add_rows(lp, 1);
        glp_set_row_bnds(lp, auxVar++, GLP_UP, 0.0, minRight);

        // l >= maxLeftFixed
        glp_set_col_bnds(lp, leftVar, GLP_LO, maxLeftFixed, 0.0);
        // w >= initialWidth
        glp_set_col_bnds(lp, leftVar + 1, GLP_LO, block->width, 0.0);
        glp_set_obj_coef(lp, leftVar, 0.0);
        glp_set_obj_coef(lp, leftVar + 1, 1.0);
    }

    glp_load_matrix(lp, ia.size() - 1, ia.data(), ja.data(), ar.data());

    glp_smcp parm;
    glp_init_smcp(&parm);
    parm.msg_lev = GLP_MSG_ERR;
    glp_simplex(lp, &parm);

    for (int i = 0; i < NC; i++) {
        blockBuffer[i]->left = glp_get_col_prim(lp, 2 * i + 1);
        blockBuffer[i]->width = glp_get_col_prim(lp, 2 * i + 2);
    }
    glp_delete_prob(lp);
}

void buildLPModel2(int NC) {
    for (int i = 0; i < NC; i++) {
        idxMap[blockBuffer[i]->idx] = i + 1;
    }
    glp_prob* lp = glp_create_prob();
    glp_set_obj_dir(lp, GLP_MAX);
    glp_add_cols(lp, NC + 1);

    clearAndReserve(ia);
    clearAndReserve(ja);
    clearAndReserve(ar);
    addConstraint(0, 0, 0.0);
    int auxVar = 1;
    for (int i = 0; i < NC; i++) {
        auto block = blockBuffer[i];
        double maxLeftFixed = 0.0;
        double minRight = 1.0;
        for (auto v : block->leftN)
            if (v->isFixed)
                maxLeftFixed = max(maxLeftFixed, v->left + v->width);
        // else
        //     cons.push_back({i + 1, idxMap[v->idx], 0.0});
        for (auto v : block->rightN)
            if (v->isFixed) minRight = min(v->left, minRight);

        for (auto v : block->cleftN) {
            if (!v->isFixed) {
                // l >= leftL + width
                addConstraint(auxVar, i + 1, 1.0);
                addConstraint(auxVar, idxMap[v->idx], -1.0);
                addConstraint(auxVar, NC + 1, -1.0);
                glp_add_rows(lp, 1);
                glp_set_row_bnds(lp, auxVar++, GLP_LO, 0.0, 0.0);
            }
        }
        // l + width <= right
        addConstraint(auxVar, i + 1, 1.0);
        addConstraint(auxVar, NC + 1, 1.0);
        glp_add_rows(lp, 1);
        glp_set_row_bnds(lp, auxVar++, GLP_UP, 0.0, minRight);

        // l >= maxLeft
        glp_set_col_bnds(lp, i + 1, GLP_LO, maxLeftFixed, 0.0);
        glp_set_obj_coef(lp, i + 1, 0.0);
    }
    // 0 <= width <= 1
    glp_set_col_bnds(lp, NC + 1, GLP_DB, 0.0, 1.0);
    glp_set_obj_coef(lp, NC + 1, 1.0);

    glp_load_matrix(lp, ia.size() - 1, ia.data(), ja.data(), ar.data());

    glp_smcp parm;
    glp_init_smcp(&parm);
    parm.msg_lev = GLP_MSG_ERR;
    glp_simplex(lp, &parm);

    double width = glp_get_col_prim(lp, NC + 1);
    for (int i = 0; i < NC; i++) {
        blockBuffer[i]->left = glp_get_col_prim(lp, i + 1);
        blockBuffer[i]->width = width;
    }
    glp_delete_prob(lp);
}

extern "C" {

void setOptions(int _isTolerance, int _ISMethod, int _applyDFS,
                int _dfsTolerance, int _LPIters, int _LPModel, int _showFixed) {
    isTolerance = _isTolerance;
    ISMethod = _ISMethod;
    applyDFS = _applyDFS;
    dfsTolerance = _dfsTolerance;
    LPIters = _LPIters;
    LPModel = _LPModel;
    showFixed = _showFixed;
}

void compute(int16_t* arr, int _N) {
    setup(_N);

    for (int i = 0; i < N; i++) {
        auto& block = blocks[i];
        blocksReordered[i] = &block;
        block.visited = false;
        block.isFixed = false;
        block.startMin = arr[2 * i];
        block.endMin = arr[2 * i + 1];
        block.duration = block.endMin - block.startMin;
        block.idx = i;
        block.depth = 0;
        // they will be reassigned later anyway, no need to initialize
        // block.pathDepth = 0;
        // block.left = 0.0;
        // block.depth = 0.0;
        block.leftN.clear();
        block.rightN.clear();
        block.cleftN.clear();
    }
    // array of schedule block pointers, used by several functions
    int total = ISMethod == 1 ? intervalScheduling() : intervalScheduling2();
    auto end = blocks + N;
    if (total <= 1 || !applyDFS) {
        for (auto block = blocks; block < end; block++) {
            block->left = static_cast<double>(block->depth) / total;
            block->width = 1.0 / total;
        }
        computeResult();
        return;
    }
    constructAdjList();
    //
    for (auto block = blocks; block < end; block++) {
        for (auto v1 : block->leftN) {
            for (auto v : block->leftN) {
                if (matrix[v->idx * N + v1->idx]) goto nextl;
            }
            block->cleftN.push_back(v1);
        nextl:;
        }
    }
    //
    calculateMaxDepth();

    int prevFixedCount = 0;
    for (auto block = blocks; block < end; block++) {
        prevFixedCount += (block->visited = block->isFixed);
        block->left = static_cast<double>(block->depth) / block->pathDepth;
        block->width = 1.0 / block->pathDepth;
    }
    int i = 0;
    auto func = LPModel == 2 ? buildLPModel2 : buildLPModel1;
    while (i < LPIters) {
        for (auto block = blocks; block < end; block++) {
            if (!block->visited) {
                func(BFS(block));
            }
        }
        for (auto block = blocks; block < end; block++)
            block->visited = block->isFixed;
        for (auto block = blocks; block < end; block++) {
            if (block->visited) continue;
            double right = block->left + block->width;
            if (abs(right - 1.0) < 1e-8) {
                DFSFindFixedNumerical(block);
                continue;
            }
            for (auto n : block->rightN) {
                if (n->isFixed && abs(right - n->left) < 1e-8) {
                    DFSFindFixedNumerical(block);
                    break;
                }
            }
        }
        int fixedCount = 0;
        for (auto block = blocks; block < end; block++)
            fixedCount += (block->visited = block->isFixed);
        if (fixedCount == prevFixedCount) {
            // cout << "convergence reached at " << i << endl;
            break;
        }
        prevFixedCount = fixedCount;
        i++;
    }
    computeResult();
}

double getSum() { return r_sum; }
double getSumSq() { return r_sumSq; }
Position* getPositions() { return r_positions; }
bool* getFixed() { return r_fixed; }
}
//