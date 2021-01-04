<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">Import Profile</div>
        <div class="m-3">
            <div class="custom-file">
                <input
                    id="customFile"
                    type="file"
                    class="custom-file-input"
                    accept="text/json"
                    style="width: 100%"
                    @change="onUploadJson($event)"
                />
                <label class="custom-file-label" for="customFile">Import from JSON..</label>
            </div>
            <small class="text-center form-text text-muted">
                Import a .json file exported by our website
            </small>
            <div class="custom-file mt-2">
                <input
                    id="customFile"
                    type="file"
                    class="custom-file-input"
                    accept="text/ics"
                    style="width: 100%"
                    disabled
                />
                <label class="custom-file-label" for="customFile">Import from ICS..</label>
            </div>
            <small class="text-center form-text text-muted"> Temporally Unavailable </small>
        </div>
        <div class="btn bg-info nav-btn">Export Profile</div>
        <div class="mx-3 my-2">
            <div class="btn-group w-100 mt-2" role="group" aria-label="Basic example">
                <button class="btn btn-outline-dark px-0" @click="saveToJson()">Export JSON</button>
                <button class="btn btn-outline-dark px-0" @click="saveToIcal()">Export iCal</button>
            </div>
            <small class="text-center form-text text-muted"> JSON: Can be imported later </small>
            <small class="form-text text-muted text-center">
                iCal: Supported by most calendar apps
            </small>
        </div>
        <hr />
        <div class="mx-3 my-2">
            <div class="btn-group w-100" role="group" aria-label="Basic example">
                <button class="btn btn-outline-primary" @click="exportToURL()">Export URL</button>
                <button class="btn btn-outline-primary" @click="print()">Print</button>
            </div>
            <small class="text-center form-text text-muted"> URL can be shared easily </small>
            <small class="form-text text-muted text-center">
                Print your currently rendered schedule
            </small>
        </div>
        <div class="btn bg-info nav-btn">Local Profiles</div>
        <ul class="list-group list-group-flush mx-auto" style="font-size: 14px; width: 99%">
            <li
                v-for="(name, idx) in profile.profiles"
                :key="name"
                class="list-group-item list-group-item-action pl-3 pr-2"
                :class="{ sel: name === profile.current }"
            >
                <div
                    class="form-row no-gutters justify-content-between"
                    @click="selectProfile(name)"
                >
                    <div :id="'1' + idx" class="col-sm-auto mr-auto" style="cursor: pointer">
                        <span v-if="newName[idx] === null" @dblclick="$set(newName, idx, name)">
                            <strong>{{ name }}</strong> <br />
                            <small v-for="field in getMeta(name)" :key="field" class="text-muted"
                                >{{ field }} <br />
                            </small>
                        </span>
                        <input
                            v-else
                            v-model="newName[idx]"
                            class="form-control form-control-inline form-control-sm"
                            type="text"
                            style="width: 99%"
                            @keyup.enter="renameProfile(name, idx)"
                            @keyup.esc="$set(newName, idx, null)"
                        />
                    </div>
                    <div class="col-sm-auto text-right" style="font-size: 16px">
                        <i
                            v-if="newName[idx] === null"
                            class="fas fa-edit click-icon"
                            title="rename this profile"
                            @click.stop="$set(newName, idx, name)"
                        ></i>
                        <i
                            v-else
                            class="fas fa-check ml-1 click-icon"
                            title="confirm renaming"
                            @click.stop="renameProfile(name, idx)"
                        ></i>
                        <i
                            v-if="newName[idx] === null && profile.profiles.length > 1"
                            class="fa fa-times ml-1 click-icon"
                            title="delete this profile"
                            @click.stop="deleteProfile(name, idx)"
                        ></i>
                        <div class="mt-2">
                            <div class="btn-group">
                                <button
                                    class="btn btn-outline-info btn-sm dropdown-toggle"
                                    type="button"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                >
                                    v{{ profile.currentVersions[idx] }}
                                </button>
                                <div class="dropdown-menu w-100 text-center">
                                    <a
                                        v-for="ver in profile.versions[idx]"
                                        :key="ver"
                                        class="dropdown-item w-100 px-0"
                                        :class="{ active: ver === profile.currentVersions[idx] }"
                                        href="#"
                                        @click.stop="switchVersion(name, idx, ver)"
                                        >v{{ ver }}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
        <template v-if="profile.canSync()">
            <div class="w-100 text-center">
                <button
                    class="btn btn-outline-primary mt-2 w-75"
                    title="Close connection to remote"
                    @click="logout()"
                >
                    Logout
                </button>
            </div>
            <div class="w-100 text-center">
                <button
                    class="btn btn-outline-primary mt-2 w-75"
                    title="Synchronize"
                    @click="profile.syncProfiles()"
                >
                    Refresh
                </button>
            </div>
        </template>
    </nav>
</template>

<script lang="ts" src="./ExportView.ts"></script>

<style scoped>
.sel {
    background-color: #b8daff;
}
.dropdown-menu {
    min-width: 0.1rem;
    max-height: 200px;
    overflow-y: auto;
    scrollbar-width: thin !important;
}
.dropdown-menu::-webkit-scrollbar {
    width: 5px;
}
.dropdown-menu::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
}
.click-icon {
    font-size: 14pt;
}
</style>
