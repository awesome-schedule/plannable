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
                            @keyup.enter="finishEdit(name, idx)"
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
                            @click="finishEdit(name, idx)"
                        ></i>
                        <i
                            v-if="profile.profiles.length > 1"
                            class="fa fa-times ml-1 click-icon"
                            title="delete this profile"
                            @click="deleteProfile(name, idx)"
                        ></i>
                        <i
                            v-if="canSync"
                            class="fas fa-upload ml-1 click-icon"
                            @click="uploadProfile(name).then(fetchRemoteProfiles)"
                        ></i>
                    </div>
                </div>
            </li>
        </ul>
        <template v-if="canSync">
            <div class="btn bg-info nav-btn mt-2">
                Remote Profiles
            </div>
            <div class="mx-4 my-2 text-center">
                Upload URL: <br />
                <input v-model="liHaoUpURL" type="text" class="form-control form-control-sm" />
                Download URL: <br />
                <input v-model="liHaoDownURL" type="text" class="form-control form-control-sm" />
                Edit URL: <br />
                <input v-model="liHaoEditURL" type="text" class="form-control form-control-sm" />
                <button class="btn btn-outline-danger mt-1" @click="fetchRemoteProfiles()">
                    Fetch All
                </button>
            </div>
            <ul class="list-group list-group-flush mx-auto" style="font-size: 14px; width: 99%">
                <li
                    v-for="data in remoteProfiles"
                    :key="data.name"
                    class="list-group-item list-group-item-action pl-3 pr-2"
                >
                    <div class="form-row no-gutters justify-content-between">
                        <div class="col-sm-auto mr-auto" style="cursor: pointer">
                            <span>
                                <span>{{ data.name }}</span> <br />
                                <small class="text-muted">{{ data.currentSemester.name }} </small>
                                <br />
                                <small class="text-muted"
                                    >{{ new Date(data.modified).toLocaleString() }}
                                </small>
                                <br />
                            </span>
                        </div>
                        <div class="col-sm-auto text-right" style="font-size: 16px">
                            <i
                                class="fa fa-download ml-1 click-icon"
                                title="Download this profile"
                                @click="downloadProfile(data)"
                            ></i>
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </nav>
</template>

<script lang="ts" src="./ExportView.ts"></script>

<style scoped>
.sel {
    background-color: #b8daff;
}
</style>
