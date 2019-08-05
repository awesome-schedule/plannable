/**
 * @module components/tabs
 */
import Store, { SemesterStorage,convertJsonToArray } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component, Watch } from 'vue-property-decorator';
import axios from 'axios';

/**
 * component for import/export/print schedules and managing profiles
 * @author Kaiying Shan, Hanzhi Zhou, Zichao Hu
 */
@Component
export default class ExportView extends Store {
    get canSync() {
        const username = localStorage.getItem('username');
        const credential = localStorage.getItem('credential');
        return username && credential;
    }
    fileName = 'schedule';
    newName: (string | null)[] = [];

    liHaoUpURL: string = 'http://localhost:8081/courses/api/save_plannable_profile';
    liHaoDownURL: string = 'http://localhost:8081/courses/api/get_plannable_profiles';
    liHaoEditURL: string = 'http://localhost:8081/courses/api/edit_plannable_profiles';

    remoteProfiles: SemesterStorage[] = [];

    created() {
        this.newName = this.profile.profiles.map(() => null);
    }
    async fetchRemoteProfiles() {
        const username = localStorage.getItem('username');
        const credential = localStorage.getItem('credential');
        this.remoteProfiles = (await axios.post(this.liHaoDownURL, {
            username,
            credential
        })).data.map((s: string) => JSON.parse(s));
    }
    /**
     * get the meta data of a profile
     * @param obj the name of the profile or the already-parsed profile
     */
    getMeta(obj: string | SemesterStorage) {
        let parsed: Partial<SemesterStorage> | null = null;
        const meta = [];
        if (typeof obj === 'string') {
            const data = localStorage.getItem(obj);
            if (data) {
                try {
                    parsed = JSON.parse(data);
                } catch (err) {
                    console.error(err);
                }
            }
        } else {
            parsed = obj;
        }
        if (parsed) {
            if (parsed.modified) meta.push(new Date(parsed.modified).toLocaleString());
            if (parsed.currentSemester) meta.push(parsed.currentSemester.name);
        }
        if (!meta.length) meta.push('Data Corruption');
        return meta;
    }

    onUploadJson(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;
        const { files } = input;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = async () => {
            if (reader.result) {
                const { profiles } = this.profile;
                const prevLen = profiles.length;
                try {
                    this.profile.addProfile(reader.result.toString(), files[0].name);
                    // unequal length: new profile name added
                    if (prevLen !== profiles.length) this.newName.push(null);
                } catch (err) {
                    console.error(err);
                    this.noti.error(err.message + ': Parsing error');
                }
                await this.loadProfile();
            } else {
                this.noti.warn('File is empty!');
            }
            input.value = '';
        };

        try {
            reader.readAsText(files[0]);
        } catch (error) {
            console.error(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.profile.current);
        if (json) savePlain(json, (this.fileName || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.fileName || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.profile.current);
        if (json) {
            const result = convertJsonToArray(json);
            const url = new URL(window.location.href);
            url.searchParams.set('config', lz.compressToEncodedURIComponent(result));
            this.modal.showURLModal(url.href);
        }
    }

    deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            this.newName.splice(idx, 1);
            const prof = this.profile.deleteProfile(name, idx);
            if (
                this.canSync &&
                this.remoteProfiles.find(p => p.name === name) &&
                confirm(`Also delete the remote profile ${name}`)
            ) {
                const username = localStorage.getItem('username')!,
                    credential = localStorage.getItem('credential');
                axios.post(this.liHaoEditURL, {
                    username,
                    credential,
                    action: 'delete',
                    name
                });
            }
            if (prof) this.loadProfile();
        }
    }
    selectProfile(profileName: string) {
        if (profileName === this.profile.current) return;
        const item = localStorage.getItem(profileName);
        if (!item) return;
        this.profile.current = profileName;
        this.loadProfile();
        this.$forceUpdate();
    }
    finishEdit(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.$set(this.newName, idx, null);
        if (newName !== oldName) {
            const prevIdx = this.profile.profiles.findIndex(n => n === newName);
            if (prevIdx !== -1) return this.noti.error('Duplicated name!');
            this.profile.renameProfile(idx, oldName, newName, raw);
            if (
                this.canSync &&
                this.remoteProfiles.find(p => p.name === oldName) &&
                confirm(`Also rename the remote profile ${oldName} to ${newName}`)
            ) {
                const username = localStorage.getItem('username')!,
                    credential = localStorage.getItem('credential');
                axios.post(this.liHaoEditURL, {
                    username,
                    credential,
                    action: 'rename',
                    oldName,
                    newName
                });
            }
        }
        this.$set(this.newName, idx, null);
    }
    print() {
        window.print();
    }

    uploadProfile(name: string) {
        const local = localStorage.getItem(name);
        if (!local) return Promise.reject('No local profile present!');

        const username = localStorage.getItem('username');
        const credential = localStorage.getItem('credential');

        const remote = this.remoteProfiles.find(p => p.name === name);
        if (remote) {
            // const t1 = new Date(remote.modified).getTime();
            // const t2 = new Date(JSON.parse(local).modified).getTime();
            if (
                !confirm('A remote profile with the same name already exists. Confirm overwriting?')
            )
                return Promise.reject('Cancelled');
        }

        return axios.post(this.liHaoUpURL, {
            username,
            credential,
            name,
            profile: local
        });
    }

    downloadProfile(profile: SemesterStorage) {
        const local = localStorage.getItem(profile.name);
        if (local) {
            const t1 = new Date(profile.modified).getTime();
            const t2 = new Date(JSON.parse(local).modified).getTime();

            // local is newer than remote
            if (t1 < t2) {
                if (
                    !confirm(
                        `Your local profile ${
                            profile.name
                        } seems newer than its corresponding remote profile. Confirm overwriting?`
                    )
                )
                    return;
            }
            localStorage.setItem(profile.name, JSON.stringify(profile));
            this.$forceUpdate();
        } else {
            this.profile.addProfile(JSON.stringify(profile), profile.name, false);
            this.newName.push(null);
        }
    }

    @Watch('profile.current', { immediate: true })
    private w() {
        this.fileName = this.profile.current;
    }
}
