#include <glpk.h>

#include <algorithm>
#include <climits>
#include <cstdint>
#include <iostream>
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
    uint16_t startMin;
    uint16_t endMin;
    int idx;
    int duration;
    int depth;
    int pathDepth;
    double left, width;
    vector<ScheduleBlock*> leftN;
    vector<ScheduleBlock*> rightN;
};

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
    return calcOverlap(b1.startMin, b1.endMin, b2.startMin, b2.endMin) > tolerance;
}

int intervalScheduling(ScheduleBlock* blocks, ScheduleBlock** occupied, int N) {
    if (N == 0) return 0;
    sort(blocks, blocks + N, [](ScheduleBlock& b1, ScheduleBlock& b2) {
        int diff = b1.startMin - b2.startMin;
        if (diff == 0) return b2.duration - b1.duration < 0;
        return diff < 0;
    });
    int occupiedSize = 0;
    int numRooms = 0;
    auto* end = blocks + N;
    for (auto* block = blocks + 1; block < end; block++) {
        int idx = -1;
        int minRoomIdx = INT_MAX;
        for (int k = 0; k < occupiedSize; k++) {
            auto* prevBlock = occupied[k];
            if (prevBlock->endMin <= block->startMin + isTolerance && prevBlock->depth < minRoomIdx) {
                minRoomIdx = prevBlock->depth;
                idx = k;
            }
        }
        if (idx == -1) {
            numRooms += 1;
            block->depth = numRooms;
            occupied[occupiedSize++] = block;
        } else {
            block->depth = occupied[idx]->depth;
            occupied[idx] = block;
        }
    }
    numRooms += 1;
    return numRooms;
}

bool* constructAdjList(ScheduleBlock* blocks, int len) {
    bool* matrix = new bool[len * len]();
    // construct an undirected graph
    for (int i = 0; i < len; i++) {
        auto& bi = blocks[i];
        for (int j = i + 1; j < len; j++) {
            auto& bj = blocks[j];
            if (conflict(bi, bj, dfsTolerance)) {
                if (bi.depth < bj.depth) {
                    matrix[bj.idx * len + bi.idx] = 1;
                    bj.leftN.push_back(&bi);
                    bi.rightN.push_back(&bj);
                } else {
                    matrix[bi.idx * len + bj.idx] = 1;
                    bj.rightN.push_back(&bi);
                    bi.leftN.push_back(&bj);
                }
            }
        }
    }
    return matrix;
}

int BFS(ScheduleBlock* start, ScheduleBlock** component) {
    int qIdx = 0;
    int NC = 1;
    component[qIdx] = start;
    start->visited = true;
    while (qIdx < NC) {
        for (auto node : component[qIdx]->leftN) {
            if (!node->visited) {
                node->visited = true;
                component[NC++] = node;
            }
        }
        for (auto node : component[qIdx]->rightN) {
            if (!node->visited) {
                node->visited = true;
                component[NC++] = node;
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
        // we only visit nodes next to the current node (depth different is exactly 1) with the same pathDepth
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

void calculateMaxDepth(ScheduleBlock* blocks, int N) {
    int* indices = new int[N];
    for (int i = 0; i < N; i++) {
        indices[i] = i;
    }
    sort(indices, indices + N, [=](int b1, int b2) {
        return blocks[b2].depth < blocks[b1].depth;
    });

    // We start from the node of the greatest depth and traverse to the lower depths
    for (int i = 0; i < N; i++) {
        auto* node = blocks + indices[i];
        if (!node->visited) depthFirstSearchRec(node, node->depth + 1);
    }
    auto* end = blocks + N;
    for (auto* node = blocks; node < end; node++) {
        node->visited = false;
    }
    for (auto* node = blocks; node < end; node++) {
        if (!node->visited && node->rightN.size() == 0) DFSFindFixed(node);
    }
    delete[] indices;
}

struct Result {
    double left, width;
};

void computeResult(ScheduleBlock* blocks, Result* results, int N) {
    for (int i = 0; i < N; i++) {
        auto& block = blocks[i];
        auto& result = results[block.idx];
        result.left = block.left;
        result.width = block.width;
    }
}

struct Cons {
    int var1, var2;
    double var3;
};

void applyLPResult(glp_prob* lp, ScheduleBlock** component, int NC) {
    double width = glp_get_col_prim(lp, NC + 1);
    for (int i = 0; i < NC; i++) {
        component[i]->left = glp_get_col_prim(lp, i + 1);
        component[i]->width = width;
    }
}

void buildLPModel1(ScheduleBlock** component, int* idxMap, int NC) {
    // int numCons = 0;
    vector<Cons> cons;
    vector<double> bounds(NC);
    for (int i = 0; i < NC; i++) {
        idxMap[component[i]->idx] = i + 1;
    }
    for (int i = 0; i < NC; i++) {
        auto block = component[i];
        double maxLeftFixed = 0.0;
        double minRight = 1.0;
        for (auto v : block->leftN)
            if (v->isFixed)
                maxLeftFixed = max(maxLeftFixed, v->left + v->width);
            else
                cons.push_back({i + 1, idxMap[v->idx], 0.0});
        for (auto v : block->rightN)
            if (v->isFixed) minRight = min(v->left, minRight);
        cons.push_back({NC + 1, i + 1, minRight});
        bounds[i] = maxLeftFixed;
    }
    glp_prob* lp = glp_create_prob();
    glp_set_obj_dir(lp, GLP_MAX);
    glp_add_rows(lp, cons.size());
    glp_add_cols(lp, NC + 1);

    int numCons = cons.size();
    int* ia = new int[numCons * 3 + 1];
    int* ja = new int[numCons * 3 + 1];
    double* ar = new double[numCons * 3 + 1];
    int count = 1;
    for (int i = 0; i < numCons; i++) {
        auto& con = cons[i];
        if (con.var1 == NC + 1) {
            ia[count] = i + 1;
            ja[count] = con.var1;
            ar[count++] = 1.0;

            ia[count] = i + 1;
            ja[count] = con.var2;
            ar[count++] = 1.0;
            glp_set_row_bnds(lp, i + 1, GLP_UP, 0.0, con.var3);
        } else {
            ia[count] = i + 1;
            ja[count] = con.var1;
            ar[count++] = 1.0;

            ia[count] = i + 1;
            ja[count] = con.var2;
            ar[count++] = -1.0;

            ia[count] = i + 1;
            ja[count] = NC + 1;
            ar[count++] = -1.0;
            glp_set_row_bnds(lp, i + 1, GLP_LO, 0.0, 0.0);
        }
    }
    // cout << NC << " " << numCons << endl;
    // lefts
    for (int i = 0; i < NC; i++) {
        glp_set_col_bnds(lp, i + 1, GLP_DB, bounds[i], 1.0);
        glp_set_obj_coef(lp, i + 1, 0.0);
    }
    // width
    glp_set_col_bnds(lp, NC + 1, GLP_DB, 0.0, 1.0);
    glp_set_obj_coef(lp, NC + 1, 1.0);

    glp_load_matrix(lp, count - 1, ia, ja, ar);

    glp_smcp parm;
    glp_init_smcp(&parm);
    parm.msg_lev = GLP_MSG_ERR;
    glp_simplex(lp, &parm);

    applyLPResult(lp, component, NC);
    glp_delete_prob(lp);

    delete[] ia;
    delete[] ja;
    delete[] ar;
}

extern "C" {

void setOptions(int _isTolerance,
                int _ISMethod,
                int _applyDFS,
                int _dfsTolerance,
                int _LPIters,
                int _LPModel,
                int _showFixed) {
    isTolerance = _isTolerance;
    ISMethod = _ISMethod;
    applyDFS = _applyDFS;
    dfsTolerance = _dfsTolerance;
    LPIters = _LPIters;
    LPModel = _LPModel;
    showFixed = _showFixed;
    // cout << LPIters << endl;
}

Result* compute(uint16_t* arr, int N) {
    auto* blocks = new ScheduleBlock[N]();
    auto* results = new Result[N];
    for (int i = 0; i < N; i++) {
        blocks[i].startMin = arr[2 * i];
        blocks[i].endMin = arr[2 * i + 1];
        blocks[i].duration = blocks[i].endMin - blocks[i].startMin;
        blocks[i].idx = i;
    }
    // array of schedule block pointers, used by several functions
    auto** component = new ScheduleBlock*[N];
    int total = intervalScheduling(blocks, component, N);
    if (total <= 1 || !applyDFS) {
        for (int i = 0; i < N; i++) {
            auto& block = blocks[i];
            block.left = static_cast<double>(block.depth) / total;
            block.width = 1.0 / total;
        }
        computeResult(blocks, results, N);
        delete[] blocks;
        delete[] component;
        return results;
    }
    bool* matrix = constructAdjList(blocks, N);
    calculateMaxDepth(blocks, N);

    auto end = blocks + N;
    int prevFixedCount = 0;
    for (auto block = blocks; block < end; block++) {
        prevFixedCount += (block->visited = block->isFixed);
        block->left = static_cast<double>(block->depth) / block->pathDepth;
        block->width = 1.0 / block->pathDepth;
    }
    delete[] matrix;
    int i = 0;
    int* idxMap = new int[N];
    while (i < LPIters) {
        for (auto block = blocks; block < end; block++) {
            if (!block->visited) {
                buildLPModel1(component, idxMap, BFS(block, component));
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
    delete[] idxMap;
    delete[] component;
    computeResult(blocks, results, N);
    delete[] blocks;
    return results;
}
}
//