# this make file is partly borrowed from https://github.com/jvail/glpk.js/blob/master/Makefile
GLPK_VERSION = 4.65

EMCC_FLAGS :=
EMCC_FLAGS += -Wall -Winline
EMCC_FLAGS += -s ALLOW_MEMORY_GROWTH=1
EMCC_FLAGS += -s ENVIRONMENT=web
EMCC_FLAGS += -s EXPORTED_FUNCTIONS='["_compute", "_setOptions", "_getPositions", "_getFixed", "_getSum", "_getSumSq", "_free"]'
# EMCC_FLAGS += -s EXPORTED_RUNTIME_METHODS='["cwrap"]'
PWD=$(shell pwd)

all: dev

getglpk:
	wget -nc http://ftp.gnu.org/gnu/glpk/glpk-$(GLPK_VERSION).tar.gz && \
	tar -xf glpk-$(GLPK_VERSION).tar.gz

glpk: getglpk
	mkdir -p $(PWD)/glpk-$(GLPK_VERSION)/build && \
	cd $(PWD)/glpk-$(GLPK_VERSION)/build && \
	emconfigure ../configure --disable-shared && \
	emmake make -j4 \

dev: graph.cpp
	cd $(PWD); \
	emcc -g -O2 --profiling $(EMCC_FLAGS) \
	-Iglpk-$(GLPK_VERSION)/src \
	glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a \
	graph.cpp -o temp/graph.js

prod: graph.cpp
	cd $(PWD); \
	emcc -O3 $(EMCC_FLAGS) \
	-Iglpk-$(GLPK_VERSION)/src \
	glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a \
	graph.cpp -o temp/graph.js