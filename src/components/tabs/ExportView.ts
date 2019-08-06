/**
 * @module components/tabs
 */
import Store, { SemesterStorage, compressJSON } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component, Watch } from 'vue-property-decorator';
import axios from 'axios';

/**
 * component for import/export/print schedules and managing profiles
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class ExportView extends Store {
    get canSync() {
        const username = localStorage.getItem('username');
        const credential = localStorage.getItem('credential');
        return username && credential;
    }
    newName: (string | null)[] = [];
    remoteNewName: (string | null)[] = [];

    liHaoUpURL: string = 'http://localhost:7000/courses/api/save_plannable_profile';
    liHaoDownURL: string = 'http://localhost:7000/courses/api/get_plannable_profile';
    liHaoEditURL: string = 'http://localhost:7000/courses/api/edit_plannable_profile';

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
        this.remoteNewName = this.remoteProfiles.map(() => null);
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
        const { current } = this.profile;
        const json = localStorage.getItem(this.profile.current);
        if (json) savePlain(json, current + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), this.profile.current + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.profile.current);
        if (json) {
            const url = new URL(window.location.href);
            url.searchParams.set(
                'config',
                lz.compressToEncodedURIComponent(JSON.stringify(compressJSON(json)))
            );
            this.modal.showURLModal(url.href);
        }
    }

    deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            this.newName.pop();
            const prof = this.profile.deleteProfile(name, idx);
            if (this.canSync) {
                const rIdx = this.remoteProfiles.findIndex(p => p.name === name);
                if (rIdx !== -1)
                    this.deleteRemote(name, rIdx, `Also delete the remote profile ${name}`);
            }

            // if the deleted profile is the current profile, reload the newly selected current profile
            if (prof) this.loadProfile();
        }
    }
    /**
     * delete profile from remote
     * @param name
     * @param msg optional confirmation msg
     */
    async deleteRemote(name: string, idx: number, msg?: string) {
        if (!msg) msg = `Are you sure to delete the remote profile ${name}?`;
        if (confirm(msg)) {
            const username = localStorage.getItem('username'),
                credential = localStorage.getItem('credential');
            await axios.post(this.liHaoEditURL, {
                username,
                credential,
                action: 'delete',
                name
            });
            this.remoteProfiles.splice(idx, 1);
            this.remoteNewName.pop();
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
    renameProfile(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.$set(this.newName, idx, null);
        if (newName !== oldName) {
            if (this.profile.profiles.find(n => n === newName))
                return this.noti.error('Duplicated name!');
            this.profile.renameProfile(idx, oldName, newName, raw);

            // find the remote profile corresponding to the profile to be renamed
            if (
                this.canSync &&
                this.remoteProfiles.find(p => p.name === oldName) &&
                confirm(`Also rename the remote profile ${oldName} to ${newName}`)
            )
                this.renameRemote(oldName, idx, newName);
        }
        this.$set(this.newName, idx, null);
    }
    async renameRemote(oldName: string, idx: number, newName?: string | null) {
        if (!newName) {
            newName = this.remoteNewName[idx];
            if (!newName) return this.$set(this.remoteNewName, idx, null);
            if (oldName === newName) return this.$set(this.remoteNewName, idx, null);
            if (this.remoteProfiles.find(p => p.name === newName))
                return this.noti.error('Duplicated name!');
        }
        const username = localStorage.getItem('username'),
            credential = localStorage.getItem('credential');
        await axios.post(this.liHaoEditURL, {
            username,
            credential,
            action: 'rename',
            oldName,
            newName
        });
        this.remoteProfiles[idx].name = newName;
        this.$set(this.remoteNewName, idx, null);
    }
    print() {
        window.print();
    }

    async uploadProfile(name: string) {
        const local = localStorage.getItem(name);
        if (!local) return Promise.reject('No local profile present!');

        const username = localStorage.getItem('username');
        const credential = localStorage.getItem('credential');

        const remote = this.remoteProfiles.find(p => p.name === name);
        if (remote) {
            if (
                !confirm('A remote profile with the same name already exists. Confirm overwriting?')
            )
                return Promise.reject('Cancelled');
        }

        await axios.post(this.liHaoUpURL, {
            username,
            credential,
            name,
            profile: local
        });
        this.remoteProfiles.push(JSON.parse(local));
    }

    downloadProfile(profile: SemesterStorage) {
        const local = localStorage.getItem(profile.name);
        if (local) {
            // const t1 = new Date(profile.modified).getTime();
            // const t2 = new Date(JSON.parse(local).modified).getTime();
            if (!confirm(`Overwrite your local profile with remote profile?`)) return;
            localStorage.setItem(profile.name, JSON.stringify(profile));
            this.$forceUpdate(); // todo
        } else {
            this.profile.addProfile(JSON.stringify(profile), profile.name, false);
            this.newName.push(null);
        }
    }
}
