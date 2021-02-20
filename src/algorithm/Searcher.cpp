#include <algorithm>
#include <cstring>
#include <iostream>
#include <string_view>
#include <vector>

#include "parallel-hashmap/parallel_hashmap/phmap.h"
using namespace std;

using phmap::flat_hash_map;

namespace Searcher {

struct Match {
    int start, end;
};

struct SearchResult {
    float score;
    int index;
    vector<Match> matches;
};

struct Token {
    string_view token;
    float score;
    vector<Match> matches;
};

// an indexed token contains an index/pointer to the array of unique tokens
// and also an index of this token in a sentence
struct IndexedToken {
    union {
        int idx;
        Token* token;
    };
    int index;
};

/**
 * represents an instance of FastSearcher
 * In theroy this can be written as a c++ class, 
 * but embind has higher code size/runtime overhead, so plain C-struct is used instead
*/
struct FastSearcher {
    int size;
    // views of _originals
    string_view* originals;
    const char** _originals;
    // tokenized sentences
    vector<IndexedToken>* sentences;
    // working window for computing results
    float* scoreWindow;
    SearchResult* results;
    vector<Token> uniqueTokens;
};

void split(const char* sentence, vector<string_view>& result) {
    const char* it = sentence;
    while (*it != 0) {
        const char* tokenStart = it;
        while (*it != ' ' && *it != 0) it++;
        result.push_back({tokenStart, static_cast<string_view::size_type>(it - tokenStart)});
        // skip spaces
        while (*it == ' ' && *it != 0) it++;
    }
}

// map a string to an pointer into the frequency table
// Reason for an additional level of indirection is that we need to constantly restore the frequency table to its original values
// Instead of copying the whole map, we just copy the frequency which is stored in a separate array
using GramMap = flat_hash_map<string_view, int16_t*>;

/**
 * returns a pointer to the frequency table and its size
 * ptr to ptr+size is the table, ptr+size to ptr+size*2 is a copy of this table
*/
inline pair<int16_t*, int> constructQueryGrams(GramMap& queryGrams, string_view query, int gramLen) {
    int queryGramCount = query.size() - gramLen + 1;
    auto* freqCount = new int16_t[queryGramCount * 2]();
    auto* curPtr = freqCount;
    for (int j = 0; j < queryGramCount; j++) {
        auto& ptr = queryGrams[query.substr(j, gramLen)];
        if (ptr == nullptr) {
            ptr = curPtr++;
        }
        (*ptr)++;
    }
    // prepare a copy of this table
    memcpy(freqCount + queryGramCount, freqCount, queryGramCount * sizeof(int16_t));
    return {freqCount, queryGramCount};
}

/**
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations
 * MIT License
 */
float compareTwoStrings(const GramMap& bigrams, int16_t* freqCount, string_view first, string_view second) {
    int len1 = first.length(),
        len2 = second.length();
    if (!len1 && !len2) return 1;          // if both are empty strings
    if (!len1 || !len2) return 0;          // if only one is empty string
    if (first == second) return 1;         // identical
    if (len1 == 1 && len2 == 1) return 0;  // both are 1-letter strings
    if (len1 < 2 || len2 < 2) return 0;    // if either is a 1-letter string

    int intersectionSize = 0;
    for (int i = 0; i < len2 - 1; i++) {
        auto it = bigrams.find(second.substr(i, 2));

        if (it != bigrams.end() && *it->second > 0) {
            *it->second -= 1;
            intersectionSize++;
        }
    }
    return (2.0f * intersectionSize) / (len1 + len2 - 2.0f);
}

vector<string_view> splitBuffer;
int bestMatchIndex = 0;
float bestMatchRating = 0.0f;

/**
 * add a new match [start, end) to an end of the match array
 * merge it with the last match if it overlaps with it
*/
inline void addMatchNoOverlap(vector<Match>& matches, int start, int end) {
    if (matches.size() && matches.back().end >= start) {
        matches.back().end = end;
    } else {
        matches.push_back({start, end});
    }
}

extern "C" {

/**
 * get a FastSearcher instance pointer
 * @param sentences an array of NULL-terminated strings. They should be .trim(), .toLowerCase(), and probably with puncturations stripped beforehand
 * @param N ths length of sentences
*/
FastSearcher* getSearcher(const char** sentences, int N) {
    auto* searcher = new FastSearcher();
    searcher->size = N;
    searcher->_originals = sentences;
    auto* originals = searcher->originals = new string_view[N];
    auto* sentenceTokens = searcher->sentences = new vector<IndexedToken>[N];
    searcher->results = new SearchResult[N]();
    auto& uniqueTokens = searcher->uniqueTokens;

    int maxTokenLen = 0;
    // map a token to an index in the uniqueTokens array
    flat_hash_map<string_view, int> str2num;
    for (int i = 0; i < N; i++) {
        const char* sentence = sentences[i];
        const char* it = sentence;
        while (*it != 0) {
            const char* tokenStart = it;
            // skip token until we hit spaces
            while (*it != ' ' && *it != 0) it++;
            string_view token(tokenStart, it - tokenStart);

            auto mit = str2num.find(token);
            if (mit == str2num.end()) {  // if new unique token, add to unique token list
                sentenceTokens[i].push_back({{str2num[token] = uniqueTokens.size()}, static_cast<int>(tokenStart - sentence)});
                uniqueTokens.push_back({token, 0.0f});
            } else {
                sentenceTokens[i].push_back({{mit->second}, static_cast<int>(tokenStart - sentence)});
            }
            // skip spaces
            while (*it == ' ' && *it != 0) it++;
        }
        originals[i] = {sentence, static_cast<string_view::size_type>(it - sentence)};
        maxTokenLen = max(maxTokenLen, static_cast<int>(sentenceTokens[i].size()));
    }
    uniqueTokens.shrink_to_fit();
    searcher->scoreWindow = new float[maxTokenLen];

    // note: we can only assign pointers into uniqueTokens here (no reallocations will occur after this point)
    // otherwise they might be invalid
    for (int i = 0; i < N; i++) {
        for (auto& token : sentenceTokens[i]) {
            token.token = &uniqueTokens[token.idx];
        }
    }

#ifdef DEBUG_LOG
    int numTokens = 0;
    for (int i = 0; i < N; i++) {
        numTokens += sentenceTokens[i].size();
    }
    cout << "num tokens: " << numTokens << " | num unique: " << uniqueTokens.size() << endl;
#endif
    return searcher;
}

/**
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations
 * MIT License
 */
void findBestMatch(FastSearcher* searcher, const char* _query) {
    string_view query(_query);
    GramMap queryGrams;
    auto [freqCount, queryGramCount] = constructQueryGrams(queryGrams, query, 2);

    bestMatchIndex = 0;
    bestMatchRating = 0.0f;
    for (int i = 0; i < searcher->size; i++) {
        float currentRating = compareTwoStrings(queryGrams, freqCount, query, searcher->originals[i]);
        if (currentRating > bestMatchRating) {
            bestMatchIndex = i;
            bestMatchRating = currentRating;
        }
        memcpy(freqCount, freqCount + queryGramCount, queryGramCount * sizeof(int16_t));
    }
    delete[] freqCount;
}

// - used to retrive results from findBestMatch
int getBestMatchIndex() {
    return bestMatchIndex;
}
// - used to retrive results from findBestMatch
float getBestMatchRating() {
    return bestMatchRating;
}

/**
 * sliding window search
*/
SearchResult* sWSearch(FastSearcher* searcher, const char* _query, const int numResults, const int gramLen, const float threshold) {
    string_view query(_query);
    splitBuffer.resize(0);
    split(_query, splitBuffer);

    int len = searcher->uniqueTokens.size();
    int maxWindow = max((int)splitBuffer.size(), 2);
    {
        GramMap queryGrams;
        auto [freqCount, queryGramCount] = constructQueryGrams(queryGrams, query, gramLen);

        // compute score and match for each unique token
        for (int i = 0; i < len; i++) {
            auto& token = searcher->uniqueTokens[i];
            const int tokenGramCount = static_cast<int>(token.token.size()) - gramLen + 1;
            if (tokenGramCount <= 0) {
                token.score = 0.0f;
                continue;
            }

            int intersectionSize = 0;
            token.matches.resize(0);  // clear previous matches
            for (int j = 0; j < tokenGramCount; j++) {
                auto it = queryGrams.find(token.token.substr(j, gramLen));
                if (it != queryGrams.end() && *(it->second) > 0) {
                    *it->second -= 1;  // decrement the frequency (don't want this gram to be matched again)
                    intersectionSize++;
                    addMatchNoOverlap(token.matches, j, j + gramLen);
                }
            }
            // intersection over union
            token.score = (2.0f * intersectionSize) / (queryGramCount + tokenGramCount);

            // restore frequency table to its original state
            memcpy(freqCount, freqCount + queryGramCount, queryGramCount * sizeof(int16_t));
        }
        delete[] freqCount;
    }

    len = searcher->size;
    auto* results = searcher->results;
    // compute score and matches for each sentence
    for (int i = 0; i < len; i++) {
        const auto& sentence = searcher->sentences[i];
        auto& result = results[i];
        result.matches.resize(0);

        const int tokenLen = sentence.size();

        // use the number of words as the window size in this string if maxWindow > number of words
        const int window = min(maxWindow, tokenLen);

        float score = 0, maxScore = 0;
        // initialize score window
        for (int j = 0; j < window; j++) {
            auto token = sentence[j].token;
            score += searcher->scoreWindow[j] = token->score;

            if (token->score < threshold) continue;
            // add token matches to sentence matches
            for (auto match : token->matches)
                addMatchNoOverlap(result.matches, sentence[j].index + match.start, sentence[j].index + match.end);
        }
        if (score > maxScore) maxScore = score;

        for (int j = window; j < tokenLen; j++) {
            // subtract the last score and add the new score
            score -= searcher->scoreWindow[j - window];
            auto token = sentence[j].token;
            score += searcher->scoreWindow[j] = token->score;

            if (token->score < threshold) continue;
            if (score > maxScore) maxScore = score;

            // add token matches to sentence matches
            for (auto match : token->matches)
                addMatchNoOverlap(result.matches, sentence[j].index + match.start, sentence[j].index + match.end);
        }
        result.score = maxScore;
        result.index = i;
    }
    if (len > numResults) {
        std::partial_sort(results, results + numResults, results + len, [](const auto& a, const auto& b) { return b.score < a.score; });
    } else {
        std::sort(results, results + len, [](const auto& a, const auto& b) { return b.score < a.score; });
    }
    return results;
}

const Match* getMatches(const SearchResult* result) {
    return result->matches.data();
}
int getMatchSize(const SearchResult* result) {
    return result->matches.size();
}

void deleteSearcher(FastSearcher* searcher) {
    delete[] searcher->originals;
    for (int i = 0; i < searcher->size; i++) {
        free((void*)searcher->_originals[i]);
    }
    free(searcher->_originals);
    delete[] searcher->sentences;
    delete[] searcher->results;
    delete[] searcher->scoreWindow;
    delete searcher;
}
}  // end extern "C"
}  // namespace Searcher
