GLPK_VERSION = 4.65

EMCC_FLAGS :=
# access emcc settings through Runtime.compilerSettings or Runtime.getCompilerSetting(name)
EMCC_FLAGS += -Wall -Winline
EMCC_FLAGS += -s RETAIN_COMPILER_SETTINGS=1
EMCC_FLAGS += -s ALLOW_MEMORY_GROWTH=1
EMCC_FLAGS += -s EXPORTED_FUNCTIONS='["_compute", "_setOptions", "_getPositions", "_getFixed", "_getSum", "_getSumSq", "_free"]'
EMCC_FLAGS += -s EXPORTED_RUNTIME_METHODS='["cwrap"]'
PWD=$(shell pwd)

all: graph.js

getglpk:
	wget -nc http://ftp.gnu.org/gnu/glpk/glpk-$(GLPK_VERSION).tar.gz && \
	tar -xf glpk-$(GLPK_VERSION).tar.gz

glpk: getglpk
	mkdir -p $(PWD)/glpk-$(GLPK_VERSION)/build && \
	cd $(PWD)/glpk-$(GLPK_VERSION)/build && \
	emconfigure ../configure --disable-shared && \
	emmake make -j4 \

graph.js: graph.cpp
	cd $(PWD); \
	emcc -O2 --profiling $(EMCC_FLAGS) \
	-Iglpk-$(GLPK_VERSION)/src \
	glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a \
	graph.cpp -o graph.js \
	&& mv graph.wasm ../../public/js/ \
	&& mv graph.js ../../public/js/

clean:
	rm -f $(PWD)/glpk.js;
	rm -f $(PWD)/glpk.wasm;
	rm -f $(PWD)/glpk-worker.js;
	rm -f $(PWD)/glpk-worker.wasm;
	rm -rf $(PWD)/src/glpk/glpk-$(GLPK_VERSION);