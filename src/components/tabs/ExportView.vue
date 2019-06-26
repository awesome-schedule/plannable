<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Import/Export Schedule
        </div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item px-1">
                <div class="custom-file">
                    <input
                        id="customFile"
                        type="file"
                        class="custom-file-input"
                        accept="text/json"
                        style="width:100%"
                        @change="onUploadJson($event)"
                    />
                    <label class="custom-file-label" for="customFile">Import From..</label>
                </div>
                <small class="text-center form-text text-muted">
                    Import a .json file exported by our website
                </small>
            </li>
            <li class="list-group-item">
                <div class="form-group row mb-0">
                    <input
                        v-model="exportJson"
                        class="form-control col-6 mr-3"
                        placeholder="filename"
                        type="text"
                    />
                    <button
                        class="btn btn-outline-dark col-5"
                        style="width:auto"
                        @click="saveToJson"
                    >
                        Export
                    </button>
                </div>
                <small class="text-center form-text text-muted mb-3">
                    Save a copy which can be imported later
                </small>
                <div class="form-group row mb-0">
                    <input
                        v-model="exportICal"
                        class="form-control col-6 mr-3"
                        placeholder="filename"
                        type="text"
                    />
                    <button class="btn btn-outline-dark col-5" @click="saveToIcal()">
                        Export iCal
                    </button>
                </div>
                <small class="form-text text-muted mb-1 text-center">
                    Google/Apple calendar support iCal files
                </small>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-primary w-100" @click="exportToURL()">
                    Export as URL
                </button>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-primary w-100" @click="print()">
                    Print
                </button>
            </li>
        </ul>
        <div class="btn bg-info nav-btn mt-2">
            Profile Management
        </div>
        <ul class="list-group list-group-flush" style="font-size: 14px">
            <li
                v-for="(name, idx) in profile.profiles"
                :key="name"
                class="list-group-item list-group-item-action pl-3 pr-2"
                :class="{ sel: name === profile.current }"
            >
                <div class="form-row no-gutters justify-content-between">
                    <div class="col-8">
                        <span v-if="newName[idx] === null" @dblclick="$set(newName, idx, name)">
                            <span>{{ name }}</span> <br />
                            <small v-for="field in getMeta(name)" :key="field" class="text-muted"
                                >{{ field }} <br />
                            </small>
                        </span>
                        <input
                            v-else
                            v-model="newName[idx]"
                            class="form-control form-control-sm"
                            type="text"
                            @keyup.enter="finishEdit(name, idx)"
                            @keyup.esc="$set(newName, idx, null)"
                        />
                    </div>
                    <div class="col-4 text-right" style="font-size: 16px">
                        <i
                            class="click-icon mr-2"
                            :class="
                                name === profile.current ? 'far fa-check-square' : 'far fa-square'
                            "
                            @click="selectProfile(name)"
                        ></i>
                        <i
                            v-if="newName[idx] === null"
                            class="fas fa-edit mr-2 click-icon"
                            title="rename this profile"
                            @click="$set(newName, idx, name)"
                        ></i>
                        <i
                            v-else
                            class="fas fa-check mr-2 click-icon"
                            title="confirm renaming"
                            @click="finishEdit(name, idx)"
                        ></i>
                        <i
                            v-if="profile.profiles.length > 1"
                            class="fa fa-times click-icon"
                            title="delete this profile"
                            @click="deleteProfile(name, idx)"
                        ></i>
                    </div>
                </div>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./ExportView.ts"></script>

<style scoped>
.sel {
    background-color: #b8daff;
}
</style>
