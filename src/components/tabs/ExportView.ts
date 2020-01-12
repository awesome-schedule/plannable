/**
 * @module components/tabs
 */

/**
 *
 */
import { backend } from '@/config';
import Store, { compressJSON, SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import axios from 'axios';
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';

/**
 * component for import/export/print schedules and managing profiles
 * @author Hanzhi Zhou, Kaiying Shan
 * @todo credential safety
 * @noInheritDoc
 */
@Component
export default class ExportView extends Store {
    newName: (string | null)[] = [];
    remoteNewName: (string | null)[] = [];
    remoteProfiles: SemesterStorage[] = [];

    _cre() {
        return [localStorage.getItem('username'), localStorage.getItem('credential')];
    }

    /**
     * return whether the credentials in the localStorage exist
     */
    canSync() {
        const [username, credential] = this._cre();
        return username && credential;
    }

    created() {
        this.newName = this.profile.profiles.map(() => null);
        if (this.canSync()) this.fetchRemoteProfiles();
    }
    async fetchRemoteProfiles() {
        const [username, credential] = this._cre();
        this.remoteProfiles = (
            await axios.post(backend.down, {
                username,
                credential
            })
        ).data.map((s: string) => JSON.parse(s));
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

    onUploadICS(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;
        const { files } = input;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = async () => {
            if (reader.result) {
                const str = reader.result.toString();
                const arr = str.split('UID:class-number-');
                arr.splice(0, 1);
                for (const str of arr) {
                    const id = parseInt(str.split('\nDESCRIPTION')[0]);
                    const sec = window.catalog.getSectionById(id);
                    this.schedule.proposedSchedule.update(sec.key, id, undefined, undefined, false);
                }

                this.schedule.proposedSchedule.constructDateSeparator();
                this.schedule.proposedSchedule.computeSchedule();
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
            const compressed = compressJSON(json);
            url.searchParams.set(
                'config',
                lz.compressToEncodedURIComponent(JSON.stringify(compressed))
            );
            this.modal.showURLModal(url.href);
        }
    }

    deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            this.newName.pop();
            const prof = this.profile.deleteProfile(name, idx);
            if (this.canSync()) {
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
            const [username, credential] = this._cre();
            await axios.post(backend.edit, {
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
                this.canSync() &&
                this.remoteProfiles.find(p => p.name === oldName) &&
                confirm(`Also rename the remote profile ${oldName} to ${newName}?`)
            )
                this.renameRemote(oldName, idx, newName);
        }
        this.$set(this.newName, idx, null);
    }
    /**
     * rename a remote profile
     * @param oldName
     * @param idx
     * @param newName if not provided, use `remoteNewName[idx]`
     */
    async renameRemote(oldName: string, idx: number, newName?: string | null) {
        if (!newName) {
            newName = this.remoteNewName[idx];
            if (!newName) return this.$set(this.remoteNewName, idx, null);
            if (oldName === newName) return this.$set(this.remoteNewName, idx, null);
            if (this.remoteProfiles.find(p => p.name === newName))
                return this.noti.error('Duplicated name!');
        }
        const [username, credential] = this._cre();
        const profile = this.remoteProfiles[idx];
        profile.name = newName;
        try {
            await axios.post(backend.edit, {
                username,
                credential,
                action: 'rename',
                oldName,
                newName,
                profile
            });
        } catch (err) {
            this.noti.error(err.message);
            profile.name = oldName;
        }
        this.$set(this.remoteNewName, idx, null);
    }
    print() {
        window.print();
    }

    async uploadProfile(name: string) {
        const local = localStorage.getItem(name);
        if (!local) return Promise.reject('No local profile present!');

        const [username, credential] = this._cre();
        const remote = this.remoteProfiles.find(p => p.name === name);
        if (remote) {
            if (
                !confirm('A remote profile with the same name already exists. Confirm overwriting?')
            )
                return Promise.reject('Cancelled');
        }

        await axios.post(backend.up, {
            username,
            credential,
            name,
            profile: local
        });
        // append to remote profiles if not overwriting
        if (!remote) {
            this.remoteProfiles.push(JSON.parse(local));
            this.remoteNewName.push(null);
        }
    }
    /**
     * save a remote profile to localStorage
     */
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

    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('credential');
        this.$forceUpdate();
    }
}
