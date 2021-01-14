/**
 * @module src/components/tabs
 */

/**
 *
 */
import { backend } from '@/config';
import Store, { compressJSON, SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';
import UAParser from 'ua-parser-js';
import { LocalProfileEntry } from '@/store/profile';

/**
 * component for import/export/print schedules and managing profiles
 * @author Hanzhi Zhou, Kaiying Shan
 * @noInheritDoc
 */
@Component
export default class ExportView extends Store {
    newName: (string | null)[] = [];

    get backendName() {
        return backend.name;
    }

    get allowBackend() {
        return window.location.protocol !== 'file:' || backend.oauth_on_electron;
    }

    /**
     * parse an user-friendly string indicating OS/device type from the user agent
     * @param ua
     */
    getParsedUA(ua: string) {
        const parser = new UAParser(ua);
        const result = parser.getResult();
        let result_str = '&nbsp;';
        if (result.os.name && result.os.version)
            result_str += result.os.name + ' ' + result.os.version;
        if (result.device.vendor) result_str += ' | ' + result.device.vendor;
        if (result.browser.name && result.browser.version)
            result_str += '<br />&nbsp;' + result.browser.name + ' ' + result.browser.version;
        return result_str;
    }

    async updateRemoteStatus(prof: LocalProfileEntry) {
        if (!prof.remote) {
            const msg = await this.profile.uploadProfile([
                {
                    name: prof.name,
                    profile: localStorage.getItem(prof.name)!
                }
            ]);
            if (msg) return this.noti.notify(msg);
            prof.remote = true;
        } else {
            if (
                confirm(
                    `If you disable sync for this profile (${prof.name}), it will be deleted from ${backend.name} and your other devices that enabled sync. Are you sure?`
                )
            ) {
                const msg = await this.profile.deleteRemote(prof.name);
                if (msg.level === 'error') {
                    return this.noti.notify(msg);
                } else if (msg.level === 'warn') {
                    this.noti.notify(msg);
                }
                prof.remote = false;
            }
        }
    }

    getRemoteStatusString(remote: boolean) {
        const msg1 = remote ? 'synced' : 'not synced';
        const msg2 = remote ? 'unsync' : 'sync';
        return `This profile is currently ${msg1} with ${backend.name}. Click me to ${msg2}.`;
    }

    created() {
        this.newName = this.profile.profiles.map(() => null);
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
    saveToJson() {
        if (!this.semester.currentSemester) return;
        const { current } = this.profile;
        const json = localStorage.getItem(this.profile.current);
        if (json) savePlain(json, current + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), this.profile.current + '.ics');
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

    async deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            const msg = await this.profile.deleteProfile(name, idx);
            this.newName.pop();
            if (msg.level !== 'success') return this.noti.notify(msg);
            // if the deleted profile is the current profile, reload the newly selected current profile
            if (msg.payload) this.loadProfile();
        }
    }
    selectProfile(profileName: string) {
        if (profileName === this.profile.current) return;
        const item = localStorage.getItem(profileName);
        if (!item) return;
        if (this.profile.tokenType) {
            // set previously selected profile to its latest version, if not already
            this.noti.clear();
            const idx = this.profile.profiles.findIndex(p => p.name === this.profile.current);
            if (!this.profile.isLatest(idx)) {
                this.profile.profiles[idx].currentVersion = this.profile.profiles[
                    idx
                ].versions[0].version;
                localStorage.setItem(
                    this.profile.current,
                    localStorage.getItem('backup-' + this.profile.current)!
                );
                localStorage.removeItem('backup-' + this.profile.current);
            }
        }
        this.profile.current = profileName;
        this.loadProfile();
        this.$forceUpdate();
    }
    async switchVersion(name: string, idx: number, version: number) {
        this.profile.profiles[idx].currentVersion = version;
        const remote = await this.profile.getRemoteProfile(name, version);
        if (remote.level === 'error') return this.noti.notify(remote);

        // backup the current profile, in case we need to switch back
        localStorage.setItem('backup-' + name, localStorage.getItem(name)!);
        localStorage.setItem(name, remote.payload!.profile);
        this.loadProfile();
        if (!this.profile.isLatest(idx))
            this.noti.warn(
                `You checked out a historical version your profile. Your changes to this profile will not be saved or synchronized with ${backend.name} unless you click "Keep".`,
                3600,
                true
            );
        this.$forceUpdate();
    }
    async keepVersion(name: string) {
        // make sure that the profile's modified time is changed to the latest so it can overwrite profiles on other synced devices
        const _profile: SemesterStorage = JSON.parse(localStorage.getItem(name)!);
        _profile.modified = new Date().toJSON();
        const profile = JSON.stringify(_profile);
        localStorage.setItem(name, profile);
        const msg = await this.profile.uploadProfile([
            {
                name,
                profile,
                new: true
            }
        ]);
        if (msg) return this.noti.notify(msg);
        localStorage.removeItem('backup-' + name);
        this.noti.clear();
        this.$forceUpdate();
    }
    async renameProfile(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.$set(this.newName, idx, null);
        if (newName !== oldName) {
            if (this.profile.profiles.find(p => p.name === newName))
                return this.noti.error('Duplicated name!');
            if (
                !this.profile.profiles[idx].remote ||
                confirm(
                    'If you rename a synced profile, all its history will be lost. Are you sure?'
                )
            ) {
                const msg = await this.profile.renameProfile(idx, oldName, newName, raw);
                if (msg) return this.noti.notify(msg);
            }
        }
        this.$set(this.newName, idx, null);
    }

    print() {
        window.print();
    }
}
