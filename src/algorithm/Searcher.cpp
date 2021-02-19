#include <algorithm>
#include <cstring>
#include <iostream>
#include <string_view>
#include <unordered_map>
#include <vector>
using namespace std;

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
        result.push_back({tokenStart, (string_view::size_type)(it - tokenStart)});
        // skip spaces
        while (*it == ' ' && *it != 0) it++;
    }
}

FastSearcher* getSearcher(const char** sentences, const int* len, int N) {
    auto* searcher = new FastSearcher();
    searcher->size = N;
    auto* originals = searcher->originals = new string_view[N];
    auto* sentenceTokens = searcher->sentences = new vector<IndexedToken>[N];
    auto& uniqueTokens = searcher->uniqueTokens;

    int maxTokenLen = 0;
    unordered_map<string_view, int> str2num;
    for (int i = 0; i < N; i++) {
        const char* sentence = sentences[i];
        originals[i] = {sentence, (string_view::size_type)(len[i])};

        const char* it = sentence;
        while (*it != 0) {
            const char* tokenStart = it;
            while (*it != ' ' && *it != 0) it++;
            string_view token(tokenStart, it - tokenStart);

            auto mit = str2num.find(token);
            if (mit == str2num.end()) {  // if new unique token, add to unique token list
                sentenceTokens[i].push_back({str2num[token] = uniqueTokens.size(), (int)(tokenStart - sentence)});
                uniqueTokens.push_back({token, 0.0f});
            } else {
                sentenceTokens[i].push_back({mit->second, (int)(tokenStart - sentence)});
            }
            // skip spaces
            while (*it == ' ' && *it != 0) it++;
        }
        maxTokenLen = max(maxTokenLen, (int)(sentenceTokens[i].size()));
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

inline unordered_map<string_view, int> constructQueryGrams(string_view query, int gramLen) {
    unordered_map<string_view, int> queryGrams;
    const auto queryGramCount = query.size() - gramLen + 1;
    for (size_t j = 0; j < queryGramCount; j++) {
        queryGrams[query.substr(j, gramLen)]++;
    }
    return queryGrams;
}

vector<string_view> splitBuffer;

void sWSearch(FastSearcher* searcher, const char* _query, int _len, int gramLen = 3, float threshold = 0.05) {
    string_view query(_query, _len);
    splitBuffer.resize(0);
    split(_query, splitBuffer);

    unordered_map<string_view, int> queryGrams = constructQueryGrams(query, gramLen);
    const int queryGramCount = queryGrams.size();
    int maxWindow = queryGramCount;

    int len = searcher->uniqueTokens.size();
    for (int i = 0; i < len; i++) {
        auto& token = searcher->uniqueTokens[i];
        const int tokenGramCount = static_cast<int>(token.token.size()) - gramLen + 1;
        if (tokenGramCount <= 0) {
            token.score = 0.0f;
            continue;
        }

        int intersectionSize = 0;
        auto queryGramsCopy = queryGrams;
        token.matches.resize(0);
        for (int j = 0; j < tokenGramCount; j++) {
            auto it = queryGramsCopy.find(token.token.substr(j, gramLen));
            if (it != queryGramsCopy.end() && it->second > 0) {
                it->second--;
                intersectionSize++;
                token.matches.push_back({j, j + gramLen});
            }
        }
        token.score = static_cast<float>(2 * intersectionSize) / (queryGramCount + tokenGramCount);
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
                // resolve overlapping matches
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
                // resolve overlapping matches
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
    std::sort(results, results + len, [](auto& a, auto& b) { return b.score < a.score; });
}

int main() {
    cout << sizeof(Token) << endl;
    const char* sentences[] = {"this is a course about computer science", "what the heck are you talking science about  "};
    int N = sizeof(sentences) / sizeof(char*);
    int len[N];
    for (int i = 0; i < N; i++) {
        len[i] = strlen(sentences[i]);
    }
    auto* searcher = getSearcher(sentences, len, 2);
    // for (auto token : searcher->uniqueTokens) {
    //     cout << token.token << endl;
    // }
    char q[] = "curse comp sci";
    sWSearch(searcher, q, sizeof(q));
    for (int i = 0; i < N; i++) {
        auto r = searcher->results[i];
        cout << r.index << endl;
        for (auto m : r.matches) {
            cout << m.start << "," << m.end << endl;
        }
    }
    return 0;
}