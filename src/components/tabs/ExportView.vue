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
            <!-- <li class="list-group-item">
                <button class="btn btn-outline-primary w-100" @click="exportToURL()">
                    Export as URL
                </button>
            </li> -->
            <li class="list-group-item">
                <button class="btn btn-outline-primary w-100" @click="print()">
                    Print
                </button>
            </li>
            <div class="btn bg-info nav-btn">
                Different Configurations
            </div>
            <li v-for="(name, idx) in profiles" :key="name" class="list-group-item">
                <p>{{ name }}</p>

                <div class="input-group">
                    <div class="input-group-prepend">
                        <button
                            v-if="newName[idx] === null"
                            class="btn btn-outline-secondary"
                            @click="$set(newName, idx, name)"
                        >
                            edit name
                        </button>
                        <button v-else class="btn btn-secondary" @click="finishEdit(name, idx)">
                            edit
                        </button>
                    </div>
                    <input
                        v-if="newName[idx] !== null"
                        v-model="newName[idx]"
                        class="form-control"
                        type="text"
                        :placeholder="name"
                    />
                    <div class="input-group-append">
                        <button class="btn btn-outline-info" @click="selectProfile(name)">
                            {{ name === currentProfile ? 'selected' : 'select' }}
                        </button>
                        <button
                            v-if="profiles.length !== 1"
                            class="btn btn-outline-danger"
                            @click="deleteProfile(name, idx)"
                        >
                            delete
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./ExportView.ts"></script>
