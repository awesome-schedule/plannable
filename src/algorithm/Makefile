# this make file is partly borrowed from https://github.com/jvail/glpk.js/blob/master/Makefile
GLPK_VERSION = 4.65

EMCC_FLAGS :=
EMCC_FLAGS += -Wall -Winline
EMCC_FLAGS += -s ALLOW_MEMORY_GROWTH=1
EMCC_FLAGS += -s MALLOC=emmalloc
EMCC_FLAGS += -s MODULARIZE=1 -s EXPORT_NAME="nativeRenderer"
# EMCC_FLAGS += -s ENVIRONMENT=web
EMCC_FLAGS += -s EXPORTED_FUNCTIONS='["_compute", "_setOptions", "_getSum", "_getSumSq", "_free", "_generate", "_sort", "_setSortOption", "_size", "_getSchedule", "_setTimeMatrix", "_setSortMode", "_getRange"]'
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

dev: ScheduleRenderer.cpp ScheduleGenerator.cpp
	emcc -O2 -g --profiling $(EMCC_FLAGS) \
	-Iglpk-$(GLPK_VERSION)/src \
	glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a \
	ScheduleRenderer.cpp ScheduleGenerator.cpp -o temp/wasm_modules.js

prod: ScheduleRenderer.cpp ScheduleGenerator.cpp
	emcc -O3 $(EMCC_FLAGS) \
	-Iglpk-$(GLPK_VERSION)/src \
	glpk-$(GLPK_VERSION)/build/src/.libs/libglpk.a \
	ScheduleRenderer.cpp ScheduleGenerator.cpp -o temp/wasm_modules.js