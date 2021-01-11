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
        <div class="mx-3 my-2 text-center">
            <div class="btn-group w-100 mt-2" role="group" aria-label="Basic example">
                <button class="btn btn-outline-dark px-0" @click="saveToJson()">Export JSON</button>
                <button class="btn btn-outline-dark px-0" @click="saveToIcal()">Export iCal</button>
            </div>
            <small class="form-text text-muted">
                JSON: Can be imported later <br />
                iCal: Supported by most calendar apps
            </small>
        </div>
        <hr />
        <div class="mx-3 my-2 text-center">
            <div class="btn-group w-100" role="group" aria-label="Basic example">
                <button class="btn btn-outline-primary" @click="exportToURL()">Export URL</button>
                <button class="btn btn-outline-primary" @click="print()">Print</button>
            </div>
            <small class="form-text text-muted">
                URL can be shared easily <br />
                Print your currently rendered schedule
            </small>
        </div>
        <div class="btn bg-info nav-btn">
            Profiles
            <template v-if="profile.tokenType">
                <i
                    class="fas fa-cloud"
                    :title="`You profiles are synchronizd with ${backendName}`"
                ></i>
                <span
                    class="badge badge-secondary ml-1"
                    title="This function is at the beta-testing stage. If you find any issues with it, please report it through GitHub issues or google form"
                >
                    Beta
                </span>
            </template>
        </div>
        <ul class="list-group list-group-flush mx-auto" style="font-size: 14px; width: 99%">
            <li
                v-for="(prof, idx) in profile.profiles"
                :key="prof.name"
                class="list-group-item list-group-item-action pl-3 pr-2"
                :class="{ sel: prof.name === profile.current }"
            >
                <div
                    class="form-row no-gutters justify-content-between"
                    style="flex-wrap: nowrap"
                    @click="selectProfile(prof.name)"
                >
                    <div :id="'1' + idx" class="col-xs-auto mr-auto" style="cursor: pointer">
                        <span
                            v-if="newName[idx] === null"
                            @dblclick="$set(newName, idx, prof.name)"
                        >
                            <strong>{{ prof.name }}</strong> <br />
                            <small
                                v-for="field in getMeta(prof.name)"
                                :key="field"
                                class="text-muted"
                                >{{ field }} <br />
                            </small>
                        </span>
                        <input
                            v-else
                            v-model="newName[idx]"
                            class="form-control form-control-inline form-control-sm"
                            type="text"
                            style="width: 95%"
                            @keyup.enter="renameProfile(prof.name, idx)"
                            @keyup.esc="$set(newName, idx, null)"
                        />
                    </div>
                    <div class="col-xs-auto text-right" style="font-size: 16px">
                        <i
                            v-if="profile.tokenType"
                            class="fas fa-cloud click-icon mr-1"
                            :class="prof.remote ? 'text-success' : 'text-warning'"
                            :title="getRemoteStatusString(prof.remote)"
                            @click.stop="updateRemoteStatus(prof)"
                        ></i>
                        <template v-if="!profile.tokenType || profile.isLatest(idx)">
                            <i
                                v-if="newName[idx] === null"
                                class="fas fa-edit click-icon"
                                title="rename this profile"
                                @click.stop="$set(newName, idx, prof.name)"
                            ></i>
                            <i
                                v-else
                                class="fas fa-check click-icon"
                                title="confirm renaming"
                                @click.stop="renameProfile(prof.name, idx)"
                            ></i>
                            <i
                                v-if="newName[idx] === null && profile.profiles.length > 1"
                                class="fa fa-times ml-1 click-icon"
                                title="delete this profile"
                                @click.stop="deleteProfile(prof.name, idx)"
                            ></i>
                        </template>
                        <template
                            v-else-if="profile.tokenType && prof.remote && !profile.isLatest(idx)"
                        >
                            <button
                                class="btn btn-outline-primary btn-sm"
                                title="Keep this version of the profile"
                                @click.stop="keepVersion(prof.name, idx)"
                            >
                                Keep
                            </button>
                        </template>
                        <div
                            v-if="profile.tokenType && prof.remote"
                            class="mt-2"
                            title="Checkout historical versions of this profile"
                        >
                            <div class="btn-group">
                                <button
                                    class="btn btn-outline-dark btn-sm dropdown-toggle"
                                    type="button"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    :disabled="prof.name !== profile.current"
                                >
                                    v{{ prof.currentVersion }}
                                </button>
                                <div class="dropdown-menu" style="line-height: 12pt">
                                    <a
                                        v-for="ver in prof.versions"
                                        :key="ver.version"
                                        class="dropdown-item px-2 pb-1 pt-0"
                                        :class="{
                                            active: ver.version === prof.currentVersion
                                        }"
                                        href="#"
                                        :title="`Full user agent: ${ver.userAgent}`"
                                        @click.stop="switchVersion(prof.name, idx, ver.version)"
                                    >
                                        <div
                                            class="row no-gutters align-items-center"
                                            style="flex-wrap: nowrap"
                                        >
                                            <div class="col col-2 mr-1 h-100">
                                                v{{ ver.version }}
                                            </div>
                                            <div class="col col-10 ua-cell text-right">
                                                <small>
                                                    &nbsp;{{
                                                        new Date(ver.modified).toLocaleString()
                                                    }}
                                                    <br />
                                                    <span
                                                        v-html="getParsedUA(ver.userAgent)"
                                                    ></span>
                                                </small>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>

        <div v-if="profile.tokenType" class="w-100 text-center">
            <button
                class="btn btn-outline-primary my-2"
                :title="`Close connection to ${backendName}`"
                @click="profile.logout()"
            >
                Logout
            </button>
            <div>
                <small class="text-muted">
                    You profiles are synchronizd with {{ backendName }}
                </small>
            </div>
        </div>

        <div v-else-if="allowBackend" class="w-100 my-3 text-center">
            <button class="btn btn-outline-primary mx-3" @click="profile.loginBackend()">
                Login to Hoosmyprofessor
            </button>
        </div>
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
.ua-cell {
    border-style: none none none solid;
    border-width: 1px;
    border-color: #666;
}
</style>
