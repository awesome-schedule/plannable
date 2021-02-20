# this make file is partly borrowed from https://github.com/jvail/glpk.js/blob/master/Makefile
GLPK_VERSION = 4.65

EMCC_FLAGS = -Wall -Winline -std=c++17
EMCC_DEV_FLAGS = -O2 -DDEBUG_LOG -DENABLE_MILP -g --profiling
EMCC_LINK_FLAGS = -s ALLOW_MEMORY_GROWTH=1
EMCC_LINK_FLAGS += -s MODULARIZE=1 -s EXPORT_NAME="GetNative" # -s ENVIRONMENT=web
EMCC_LINK_FLAGS += -s EXPORTED_FUNCTIONS='[\
"_compute", "_setOptions", "_getSum", "_getSumSq", "_free", \
"_generate", "_sort", "_setSortOption", "_size", "_getSchedule", "_setTimeMatrix", "_setSortMode", "_getRange", "_setRefSchedule", \
"_getSearcher", "_getMatches", "_getMatchSize", "_sWSearch", "_findBestMatch", "_getBestMatchIndex", "_getBestMatchRating"\
]'
EMCC_LINK_FLAGS += -s EXPORTED_RUNTIME_METHODS='["stringToUTF8", "lengthBytesUTF8"]'

all: dev

getglpk:
	wget -nc http://ftp.gnu.org/gnu/glpk/glpk-$(GLPK_VERSION).tar.gz && \
	tar -xf glpk-$(GLPK_VERSION).tar.gz

glpk: getglpk
	mkdir -p $(PWD)/glpk-$(GLPK_VERSION)/build && \
	cd $(PWD)/glpk-$(GLPK_VERSION)/build && \
	emconfigure ../configure --disable-shared && \
	emmake make -j4 \

%.dev.o: %.cpp
	emcc $(EMCC_DEV_FLAGS) $(EMCC_FLAGS) -Iglpk-$(GLPK_VERSION)/src $< -c -o $@

dev: Renderer.dev.o ScheduleGenerator.dev.o Searcher.dev.o
	emcc $(EMCC_DEV_FLAGS) $(EMCC_LINK_FLAGS) glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a *.dev.o -o temp/wasm_modules.js

%.prod.o: %.cpp
	emcc -O3 $(EMCC_FLAGS) -Iglpk-$(GLPK_VERSION)/src $< -c -o $@

prod: Renderer.prod.o ScheduleGenerator.prod.o Searcher.prod.o
	emcc -O3 --closure 1 $(EMCC_LINK_FLAGS) glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a *.prod.o -o temp/wasm_modules.js

clean:
	rm -f *.prod.o
	rm -f *.dev.o