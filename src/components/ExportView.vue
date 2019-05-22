<template>
    <nav class="d-block bg-light sidebar">
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
                    <button class="btn btn-outline-dark col-5" @click="saveToIcal">
                        Export iCal
                    </button>
                </div>
                <small class="form-text text-muted mb-1 text-center">
                    Google/Apple calendar support iCal files
                </small>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-primary w-100" @click="print">
                    Print
                </button>
            </li>
            <li class="list-group-item"></li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./ExportView.ts"></script>
