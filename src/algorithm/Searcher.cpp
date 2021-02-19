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

struct IndexedToken {
    union {
        int idx;
        Token* token;
    };
    int index;
};

struct FastSearcher {
    int size;
    string_view* originals;
    const char** _originals;
    vector<IndexedToken>* sentences;
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

inline pair<int16_t*, int> constructQueryGrams(flat_hash_map<string_view, int16_t*>& queryGrams, string_view query, int gramLen) {
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
    memcpy(freqCount + queryGramCount, freqCount, queryGramCount * 2);
    return {freqCount, queryGramCount};
}

vector<string_view> splitBuffer;

extern "C" {

FastSearcher* getSearcher(const char** sentences, int N) {
    auto* searcher = new FastSearcher();
    searcher->size = N;
    searcher->_originals = sentences;
    auto* originals = searcher->originals = new string_view[N];
    auto* sentenceTokens = searcher->sentences = new vector<IndexedToken>[N];
    auto& uniqueTokens = searcher->uniqueTokens;

    int maxTokenLen = 0;
    flat_hash_map<string_view, int> str2num;
    for (int i = 0; i < N; i++) {
        const char* sentence = sentences[i];
        const char* it = sentence;
        while (*it != 0) {
            const char* tokenStart = it;
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
    for (int i = 0; i < N; i++) {
        for (auto& token : sentenceTokens[i]) {
            token.token = &uniqueTokens[token.idx];
        }
    }
    searcher->scoreWindow = new float[maxTokenLen];
    searcher->results = new SearchResult[N]();
    return searcher;
}

SearchResult* sWSearch(FastSearcher* searcher, const char* _query, const int numResults, const int gramLen, const float threshold) {
    string_view query(_query);
    splitBuffer.resize(0);
    split(_query, splitBuffer);

    int len = searcher->uniqueTokens.size();
    int maxWindow = max((int)splitBuffer.size(), 2);
    {
        flat_hash_map<string_view, int16_t*> queryGrams;
        auto [freqCount, queryGramCount] = constructQueryGrams(queryGrams, query, gramLen);

        for (int i = 0; i < len; i++) {
            auto& token = searcher->uniqueTokens[i];
            const int tokenGramCount = static_cast<int>(token.token.size()) - gramLen + 1;
            if (tokenGramCount <= 0) {
                token.score = 0.0f;
                continue;
            }

            int intersectionSize = 0;

            token.matches.resize(0);
            for (int j = 0; j < tokenGramCount; j++) {
                auto it = queryGrams.find(token.token.substr(j, gramLen));
                if (it != queryGrams.end() && *(it->second) > 0) {
                    *it->second -= 1;
                    intersectionSize++;
                    token.matches.push_back({j, j + gramLen});
                }
            }
            token.score = static_cast<float>(2 * intersectionSize) / (queryGramCount + tokenGramCount);
            memcpy(freqCount, freqCount + queryGramCount, queryGramCount * 2);
        }
        delete[] freqCount;
    }

    len = searcher->size;
    auto* results = searcher->results;
    for (int i = 0; i < len; i++) {
        const auto& sentence = searcher->sentences[i];
        auto& result = results[i];
        result.matches.resize(0);

        const int tokenLen = sentence.size();

        // use the number of words as the window size in this string if maxWindow > number of words
        const auto window = min(maxWindow, tokenLen);

        float score = 0, maxScore = 0;
        // initialize score window
        for (int j = 0; j < window; j++) {
            auto& token = sentence[j].token;
            float tokenScore = searcher->scoreWindow[j] = token->score;
            score += tokenScore;

            if (tokenScore < threshold) continue;
            for (auto match : token->matches) {
                int start = sentence[j].index + match.start;
                int end = sentence[j].index + match.end;
                // merge overlapping matches
                if (result.matches.size() && result.matches.back().end >= start) {
                    result.matches.back().end = end;
                } else {
                    result.matches.push_back({start, end});
                }
            }
        }
        if (score > maxScore) maxScore = score;

        for (int j = window; j < tokenLen; j++) {
            // subtract the last score and add the new score
            score -= searcher->scoreWindow[j - window];
            auto& token = sentence[j].token;
            score += searcher->scoreWindow[j] = token->score;

            if (token->score < threshold) continue;
            if (score > maxScore) maxScore = score;

            for (auto match : token->matches) {
                int start = sentence[j].index + match.start;
                int end = sentence[j].index + match.end;
                // merge overlapping matches
                if (result.matches.size() && result.matches.back().end >= start) {
                    result.matches.back().end = end;
                } else {
                    result.matches.push_back({start, end});
                }
            }
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
}

}  // namespace Searcher

int main() {
    using namespace Searcher;
    cout << sizeof(Searcher::SearchResult) << endl;
    const char* sentences[] = {"this is a course about computer science", "what the heck are you talking science about  "};
    auto* searcher = getSearcher(sentences, 2);
    // for (auto token : searcher->uniqueTokens) {
    //     cout << token.token << endl;
    // }
    sWSearch(searcher, "what the", 10, 3, 0.05);
    for (int i = 0; i < 2; i++) {
        auto r = searcher->results[i];
        cout << r.index << endl;
        for (auto m : r.matches) {
            cout << m.start << "," << m.end << endl;
        }
    }
    return 0;
}