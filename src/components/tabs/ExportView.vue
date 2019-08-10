<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Import Profile
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
        </ul>
        <div class="btn bg-info nav-btn">
            Export Profile
        </div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item">
                <div class="btn-group w-100 mt-2" role="group" aria-label="Basic example">
                    <button class="btn btn-outline-dark px-0" @click="saveToJson()">
                        Export JSON
                    </button>
                    <button class="btn btn-outline-dark px-0" @click="saveToIcal()">
                        Export iCal
                    </button>
                </div>
                <small class="text-center form-text text-muted">
                    JSON: Can be imported later
                </small>
                <small class="form-text text-muted text-center">
                    iCal: Supported by most calendar apps
                </small>
            </li>
            <li class="list-group-item">
                <div class="btn-group w-100" role="group" aria-label="Basic example">
                    <button class="btn btn-outline-primary" @click="exportToURL()">
                        Export URL
                    </button>
                    <button class="btn btn-outline-primary" @click="print()">
                        Print
                    </button>
                </div>
                <small class="text-center form-text text-muted">
                    URL can be shared easily
                </small>
                <small class="form-text text-muted text-center">
                    Print your currently rendered schedule
                </small>
            </li>
        </ul>
        <div class="btn bg-info nav-btn mt-2">
            Local Profiles
        </div>
        <ul class="list-group list-group-flush mx-auto" style="font-size: 14px; width: 99%">
            <li
                v-for="(name, idx) in profile.profiles"
                :key="name"
                class="list-group-item list-group-item-action pl-3 pr-2"
                :class="{ sel: name === profile.current }"
            >
                <div class="form-row no-gutters justify-content-between">
                    <div
                        class="col-sm-auto mr-auto"
                        style="cursor: pointer"
                        @click="selectProfile(name)"
                    >
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
                            @keyup.enter="renameProfile(name, idx)"
                            @keyup.esc="$set(newName, idx, null)"
                        />
                    </div>
                    <div class="col-sm-auto text-right" style="font-size: 16px">
                        <i
                            class="click-icon mr-2"
                            :class="
                                name === profile.current ? 'far fa-check-square' : 'far fa-square'
                            "
                            title="select this profile"
                            @click="selectProfile(name)"
                        ></i>
                        <i
                            v-if="newName[idx] === null"
                            class="fas fa-edit click-icon"
                            title="rename this profile"
                            @click="$set(newName, idx, name)"
                        ></i>
                        <i
                            v-else
                            class="fas fa-check ml-1 click-icon"
                            title="confirm renaming"
                            @click="renameProfile(name, idx)"
                        ></i>
                        <i
                            v-if="profile.profiles.length > 1"
                            class="fa fa-times ml-1 click-icon"
                            title="delete this profile"
                            @click="deleteProfile(name, idx)"
                        ></i>
                        <i
                            v-if="canSync()"
                            class="fas fa-upload ml-1 click-icon"
                            title="upload this profile to remote"
                            @click="uploadProfile(name)"
                        ></i>
                    </div>
                </div>
            </li>
        </ul>
        <template v-if="canSync()">
            <div class="btn bg-info nav-btn mt-2">
                Remote Profiles <span class="badge badge-primary">Beta</span>
            </div>
            <ul class="list-group list-group-flush mx-auto" style="font-size: 14px; width: 99%">
                <li
                    v-for="(data, idx) in remoteProfiles"
                    :key="data.name"
                    class="list-group-item list-group-item-action pl-3 pr-2"
                >
                    <div class="form-row no-gutters justify-content-between">
                        <div class="col-sm-auto mr-auto" style="cursor: pointer">
                            <span v-if="remoteNewName[idx] === null">
                                <span>{{ data.name }}</span> <br />
                                <small class="text-muted">{{ data.currentSemester.name }} </small>
                                <br />
                                <small class="text-muted"
                                    >{{ new Date(data.modified).toLocaleString() }}
                                </small>
                                <br />
                            </span>
                            <input
                                v-else
                                v-model="remoteNewName[idx]"
                                class="form-control form-control-sm"
                                type="text"
                                @keyup.enter="renameRemote(data.name, idx)"
                                @keyup.esc="$set(remoteNewName, idx, null)"
                            />
                        </div>
                        <div class="col-sm-auto text-right" style="font-size: 16px">
                            <i
                                v-if="remoteNewName[idx] === null"
                                class="fas fa-edit click-icon"
                                title="rename this profile"
                                @click="$set(remoteNewName, idx, data.name)"
                            ></i>
                            <i
                                v-else
                                class="fas fa-check ml-1 click-icon"
                                title="confirm renaming"
                                @click="renameRemote(data.name, idx)"
                            ></i>
                            <i
                                class="fa fa-times ml-1 click-icon"
                                title="delete this profile"
                                @click="deleteRemote(data.name, idx)"
                            ></i>
                            <i
                                class="fa fa-download ml-1 click-icon"
                                title="download this profile"
                                @click="downloadProfile(data)"
                            ></i>
                        </div>
                    </div>
                </li>
            </ul>
            <div class="w-100 text-center">
                <button
                    class="btn btn-outline-primary mt-2 w-75"
                    title="Close connection to remote"
                    @click="logout()"
                >
                    Logout
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
</style>
