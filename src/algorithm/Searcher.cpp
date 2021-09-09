#include <algorithm>
#include <cstring>
#include <iostream>
#include <string_view>
#include <vector>

#ifdef USE_FLATMAP

#include "parallel-hashmap/parallel_hashmap/phmap.h"

template <typename K, typename V>
using HashMap = phmap::flat_hash_map<K, V>;
template <typename K>
using HashSet = phmap::flat_hash_set<K>;

#else

#include <unordered_map>
#include <unordered_set>
template <typename K, typename V>
using HashMap = std::unordered_map<K, V>;
template <typename K>
using HashSet = std::unordered_set<K>;

#endif

using namespace std;
using GramMap = HashMap<string_view, int16_t*>;

namespace Searcher {

HashSet<string> stopWords{"i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"};

struct Match {
    int start, end;
};

// an indexed token contains an index to the array of unique tokens
// and also an index of this token in the original sentence that contains it
struct IndexedToken {
    int idx;
    vector<int> indices;
    IndexedToken(int idx, vector<int>&& indices): idx(idx), indices(indices) {
        this->indices.shrink_to_fit();
    }
};

struct Sentence {
    // the sentence in its original form. Owns memory!
    string_view original;
    // tokenized sentence
    vector<IndexedToken> tokens;
    // score for this sentence (computed after a search)
    float score;
    // matches for this sentence (computed after a search)
    vector<Match> matches;
    ~Sentence() {
        free((void*)original.data());
    }
};

/**
 * represents an instance of FastSearcher
 * In theroy this can be written as a c++ class, 
 * but embind has higher code size/runtime overhead, so plain C-struct is used instead
*/
struct FastSearcher {
    int size;
    // array of pre-processed and tokenized sentences
    Sentence* sentences;
    int* indices;
    vector<string_view> uniqueTokens;
    FastSearcher(int N): size(N), sentences(new Sentence[N]), indices(new int[N]) {
    }
    ~FastSearcher() {
        delete[] indices;
        delete[] sentences;
    }
};

struct TokenGrams {
    const int gramCount;
    // freqCount to freqCount+gramCount is the table, freqCount+gramCount to freqCount+gramCount*2 is a copy of this table
    int16_t* freqCount;
    // A hashmap that maps a string to an pointer into the frequency table, which indicates the frequency of the gram
    // Reason for an additional level of indirection is that we need to constantly restore the frequency table to its original values
    // Instead of copying the whole map, we just copy the frequency which is stored in a separate array
    GramMap gramMap;

    TokenGrams(string_view query, int gramLen) : gramCount(query.size() - gramLen + 1), freqCount(new int16_t[gramCount * 2]()) {
        auto* curPtr = freqCount;
        for (int j = 0; j < gramCount; j++) {
            auto& ptr = gramMap[query.substr(j, gramLen)];
            if (ptr == nullptr) {
                ptr = curPtr++;
            }
            (*ptr)++;
        }
        // prepare a copy of this table
        memcpy(freqCount + gramCount, freqCount, gramCount * sizeof(int16_t));
    }
    ~TokenGrams() {
        delete[] freqCount;
    }
    inline void restoreFreq() {
        memcpy(freqCount, freqCount + gramCount, gramCount * sizeof(int16_t));
    }
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

/**
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations
 * MIT License
 */
float compareTwoStrings(const GramMap& bigrams, string_view first, string_view second) {
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
    auto* searcher = new FastSearcher(N);
    auto& uniqueTokens = searcher->uniqueTokens;

    // map a token to an index in the uniqueTokens array
    HashMap<string_view, int> str2num(N * 2);
    // a temporary map that maps the unique token index to the indices the token appears in the sentence
    HashMap<int, vector<int>> unique_sent_tokens;
    for (int i = 0; i < N; i++) {
        const char* sentence = sentences[i];
        const char* it = sentence;
        while (*it != 0) {
            // skip spaces
            while (*it == ' ' && *it != 0) it++;

            const char* tokenStart = it;
            // skip token until we hit spaces
            while (*it != ' ' && *it != 0) it++;
            string_view token(tokenStart, it - tokenStart);
            if (token.size() <= 1 || stopWords.find(token) != stopWords.end())
                continue;

            auto [mit, success] = str2num.insert({token, uniqueTokens.size()});
            if (success)  // if new unique token, add it to unique token list
                uniqueTokens.push_back(token);
            // record the position of this token in the unique token list
            unique_sent_tokens[mit->second].push_back(static_cast<int>(tokenStart - sentence));
        }
        searcher->sentences[i].original = {sentence, static_cast<string_view::size_type>(it - sentence)};
        auto& s_tokens = searcher->sentences[i].tokens;
        s_tokens.reserve(unique_sent_tokens.size());
        for (auto& [k, v] : unique_sent_tokens)
            s_tokens.emplace_back(k, std::move(v));
        unique_sent_tokens.clear();
    }
    // free the string array, but not strings themselves
    free((void*)sentences);
    uniqueTokens.shrink_to_fit();

#ifdef DEBUG_LOG
    int numTokens = 0;
    for (int i = 0; i < N; i++) {
        numTokens += searcher->sentences[i].tokens.size();
    }
    cout << "num tokens: " << numTokens << " | num unique: " << uniqueTokens.size() << endl;
#endif
    return searcher;
}

/**
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations
 * MIT License
 * @param _query a dynamically allocated string. It will be freed before this function returns.
 */
int findBestMatch(FastSearcher* searcher, const char* _query) {
    string_view query(_query);
    TokenGrams tokenGrams(query, 2);

    float bestMatchRating = 0.0f;
    int bestMatchIndex = 0;
    for (int i = 0; i < searcher->size; i++) {
        float currentRating = compareTwoStrings(tokenGrams.gramMap, query, searcher->sentences[i].original);
        if (currentRating > bestMatchRating) {
            bestMatchIndex = i;
            bestMatchRating = currentRating;
        }
        tokenGrams.restoreFreq();
    }
    searcher->sentences[bestMatchIndex].score = bestMatchRating;
    free((void*)_query);
    return bestMatchIndex;
}

/**
 * sliding window search
 * @param _query a dynamically allocated string. It will be freed after this function returns.
*/
int* sWSearch(FastSearcher* searcher, const char* _query, const int numResults, const int gramLen, const float threshold) {
    splitBuffer.clear();
    split(_query, splitBuffer);

    struct TokenMatch {
        int queryTkIdx;
        float score = 0.0f;
        vector<Match> matches;
        TokenMatch() = default;
        TokenMatch(int idx): queryTkIdx(idx) {}
    };
    
    int len = searcher->uniqueTokens.size();
    vector<TokenMatch> tokenMatches(len);
    vector<TokenGrams> queryTokenGrams;
    const int querySize = splitBuffer.size();
    queryTokenGrams.reserve(querySize);
    for (auto token : splitBuffer) {
        queryTokenGrams.emplace_back(token, gramLen);
    }

    // compute score and match for each unique token
    for (int i = 0; i < len; i++) {
        auto& token = searcher->uniqueTokens[i];
        const int tokenGramCount = static_cast<int>(token.size()) - gramLen + 1;
        if (tokenGramCount <= 0)
            continue;

        for (int j = 0; j < querySize; j++) {
            auto& qTkGrams = queryTokenGrams[j];
            int intersectionSize = 0;
            TokenMatch tkMatch(j);
            for (int k = 0; k < tokenGramCount; k++) {
                auto it = qTkGrams.gramMap.find(token.substr(k, gramLen));
                if (it != qTkGrams.gramMap.end() && *(it->second) > 0) {
                    *it->second -= 1;  // decrement the frequency (don't want this gram to be matched again)
                    intersectionSize++;
                    addMatchNoOverlap(tkMatch.matches, k, k + gramLen);
                }
            }
            // restore frequency table to its original state
            qTkGrams.restoreFreq();

            // ignore token match if too few grams are matched
            if (tokenGramCount - intersectionSize > 1 && intersectionSize <= 1)
                continue;

            // intersection over union
            tkMatch.score = (2.0f * intersectionSize) / (qTkGrams.gramCount + tokenGramCount);
            if (tkMatch.score > tokenMatches[i].score) {
                tokenMatches[i] = std::move(tkMatch);
            }
        }
    }

    len = searcher->size;
    // compute score and matches for each sentence
    vector<Match> tempMatches;
    // frequency of matches of each token in the query
    vector<int> tkMatchFreq(querySize);
    for (int i = 0; i < len; i++) {
        auto& sentence = searcher->sentences[i];
        sentence.score = 0.0f;
        sentence.matches.clear();
        if (!sentence.tokens.size())
            continue;

        tempMatches.clear();
        fill(tkMatchFreq.begin(), tkMatchFreq.end(), 0);
        for (const auto& token : sentence.tokens) {
            const auto& tkMatches = tokenMatches[token.idx];
            tkMatchFreq[tkMatches.queryTkIdx]++;
            sentence.score += tkMatches.score;
            for (const auto& match : tkMatches.matches) {
                for (auto idx : token.indices) {
                    tempMatches.push_back({idx + match.start, idx + match.end});
                }
            }
        }
        float penalty = 1.0f;
        for (int freq : tkMatchFreq)
            penalty += (freq < 1) * 2 + pow(freq, 0.75);
        sentence.score /= penalty;
        sort(tempMatches.begin(), tempMatches.end(), [](const auto& m1, const auto& m2) { return m1.start < m2.start; });
        for (const auto& match : tempMatches) {
            addMatchNoOverlap(sentence.matches, match.start, match.end);
        }
    }
    for (int i = 0; i < len; i++) {
        searcher->indices[i] = i;
    }
    if (len > numResults) {
        std::partial_sort(
            searcher->indices,
            searcher->indices + numResults, searcher->indices + len,
            [searcher](int a, int b) {
                return searcher->sentences[b].score < searcher->sentences[a].score;
            });
    } else {
        std::sort(
            searcher->indices,
            searcher->indices + len,
            [searcher](int a, int b) {
                return searcher->sentences[b].score < searcher->sentences[a].score;
            });
    }
    free((void*)_query);
    return searcher->indices;
}

const Match* getMatches(const FastSearcher* searcher, int idx) {
    return searcher->sentences[idx].matches.data();
}
int getMatchSize(const FastSearcher* searcher, int idx) {
    return searcher->sentences[idx].matches.size();
}
float getScore(const FastSearcher* searcher, int idx) {
    return searcher->sentences[idx].score;
}

void deleteSearcher(FastSearcher* searcher) {
    delete searcher;
}
}  // end extern "C"
}  // namespace Searcher
