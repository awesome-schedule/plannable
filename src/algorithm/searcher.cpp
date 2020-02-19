#include "searcher.h"
#include <emscripten.h>
#include <emscripten/bind.h>

vector<string> stringVec(int len) {
    return vector<string>(len);
}

EMSCRIPTEN_BINDINGS(module) {
    emscripten::class_<_FastSearcher>("_FastSearcher")
        .constructor<vector<string>>()
        .function("sWSearch", &_FastSearcher::sWSearch);

    emscripten::class_<_SearchResult>("_SearchResult")
        .property("score", &_SearchResult::score)
        .property("index", &_SearchResult::index)
        .property("matches", &_SearchResult::matches);

    emscripten::function("_stringVec", &stringVec);
    emscripten::register_vector<int>("vector<int>");
    emscripten::register_vector<string>("vector<string>");
    emscripten::register_vector<_SearchResult>("vector<_SearchResult>");
}