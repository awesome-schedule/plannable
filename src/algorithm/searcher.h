#include <algorithm>
#include <iostream>
#include <iterator>
#include <memory>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

struct _TokenData {
    float score;
    vector<int> matches;
};
struct _SearchResult {
    float score;
    int index;
    vector<int> matches;
};

class _FastSearcher {
   private:
    vector<int> idxOffsets;
    vector<int> indices;
    vector<int> tokenIds;

    vector<string> uniqueTokens;
    int maxTokenLen = 0;

   public:
    vector<string> items;

    /**
     * @param targets the list of strings to search from
     */
    _FastSearcher(const vector<string>& items) : items(items) {
        vector<vector<string>> allTokens(items.size());
        idxOffsets.resize(items.size() + 1);

        int tokenLen = 0;
        for (int i = 0; i < items.size(); i++) {
            istringstream iss(items[i]);
            copy(istream_iterator<string>(iss), istream_iterator<string>(), back_inserter(allTokens[i]));

            idxOffsets[i] = tokenLen;
            auto len = allTokens[i].size();
            tokenLen += len;
            if (len > maxTokenLen) maxTokenLen = len;
        }
        idxOffsets[items.size()] = tokenLen;

        indices.resize(tokenLen);
        tokenIds.resize(tokenLen);

        unordered_map<string, int> str2num;
        for (int j = 0; j < allTokens.size(); j++) {
            const auto& tokens = allTokens[j];
            const auto& t0 = tokens[0];
            const int offset = idxOffsets[j];

            auto it = str2num.find(t0);
            if (it == str2num.end()) {
                auto r = str2num.emplace(t0, uniqueTokens.size());
                it = r.first;
                uniqueTokens.push_back(t0);
            }
            tokenIds[offset] = it->second;
            const auto& original = items[j];
            for (int i = 1; i < tokens.size(); i++) {
                const auto& token = tokens[i];

                auto it = str2num.find(token);
                if (it == str2num.end()) {
                    auto r = str2num.emplace(token, uniqueTokens.size());
                    it = r.first;
                    uniqueTokens.push_back(token);
                }
                tokenIds[offset + i] = it->second;
                indices[offset + i] = original.find(
                    token,
                    indices[offset + i - 1] + tokens[i - 1].size());
            }
        }

        cout << "all tokens " << tokenLen << endl;
        cout << "unique tokens " << uniqueTokens.size() << endl;
    }

    /**
     * sliding window search
     * @param query
     * @param maxWindow
     * @param gramLen
     */
    auto sWSearch(string query, int maxWindow, int gramLen, float threshold) {
        unordered_map<string, int> queryGrams;
        const auto queryGramCount = query.size() - gramLen + 1;
        for (size_t j = 0; j < queryGramCount; j++) {
            queryGrams[query.substr(j, gramLen)]++;
        }

        auto len = uniqueTokens.size();
        const auto tokenData = make_unique<_TokenData[]>(len);
        // compute score for each token
        for (size_t i = 0; i < len; i++) {
            const auto& str = uniqueTokens[i];
            const auto tokenGramCount = str.size() - gramLen + 1;
            auto& data = tokenData[i];
            int intersectionSize = 0;
            unordered_map<string, int> queryGramsCopy = queryGrams;
            for (size_t j = 0; j < tokenGramCount; j++) {
                auto it = queryGramsCopy.find(str.substr(j, gramLen));
                if (it != queryGramsCopy.end() && it->second > 0) {
                    it->second--;
                    intersectionSize++;
                    data.matches.push_back(j);
                    data.matches.push_back(j + gramLen);
                }
            }
            data.score = static_cast<float>(2 * intersectionSize) / (queryGramCount + tokenGramCount);
        }

        len = items.size();
        // score & matches for each sentence
        vector<_SearchResult> allMatches(len);
        auto scoreWindow = make_unique<float[]>(maxTokenLen);
        for (size_t i = 0; i < len; i++) {
            const auto offset = idxOffsets[i];
            const auto tokenLen = idxOffsets[i + 1] - offset;

            // use the number of words as the window size in this string if maxWindow > number of words
            const auto window = min(maxWindow, tokenLen);

            float score = 0, maxScore = 0;

            auto& result = allMatches[i];
            // initialize score window
            for (int j = 0; j < window; j++) {
                auto& data = tokenData[tokenIds[offset + j]];
                score += scoreWindow[j] = data.score;

                if (data.score < threshold) continue;
                const auto temp = indices[offset + j];
                for (auto mIdx : data.matches) {
                    result.matches.push_back(mIdx + temp);
                }
            }
            if (score > maxScore) maxScore = score;

            for (int j = window; j < tokenLen; j++) {
                // subtract the last score and add the new score
                score -= scoreWindow[j - window];
                auto& data = tokenData[tokenIds[offset + j]];
                score += scoreWindow[j] = data.score;

                if (data.score < threshold) continue;
                if (score > maxScore) maxScore = score;

                const auto temp = indices[offset + j];
                for (auto mIdx : data.matches) {
                    result.matches.push_back(mIdx + temp);
                }
            }
        }
        return allMatches;
    }
};