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

/**
 * component for import/export/print schedules and managing profiles
 * @author Hanzhi Zhou, Kaiying Shan
 * @todo credential safety
 * @noInheritDoc
 */
@Component
export default class ExportView extends Store {
    newName: (string | null)[] = [];

    get backendName() {
        return backend.name;
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

    onUploadICS(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;
        const { files } = input;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                if (!reader.result) throw new Error('File is empty!');

                // use set to remove duplicates
                const ids = new Set(
                    (reader.result.toString().match(/^UID:class-number-([0-9]+)$/gm) || []).map(
                        str => {
                            const comp = str.split('-');
                            return +comp[comp.length - 1];
                        }
                    )
                );

                this.schedule.newProposed();
                for (const id of ids) {
                    const sec = window.catalog.getSectionById(id);
                    this.schedule.proposedSchedule.update(sec.key, id, undefined, undefined, false);
                }

                this.schedule.proposedSchedule.constructDateSeparator();
                this.schedule.proposedSchedule.computeSchedule();
                this.saveStatus();
                this.noti.info('Schedule loaded from ICS!');
            } catch (e) {
                console.log(e);
                this.noti.error(e.message);
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

    async deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            const msg = await this.profile.deleteProfile(name, idx);
            this.newName.pop();
            if (msg.level === 'error') return this.noti.notify(msg);
            // if the deleted profile is the current profile, reload the newly selected current profile
            if (msg.payload) this.loadProfile();
        }
    }
    selectProfile(profileName: string) {
        if (profileName === this.profile.current) return;
        const item = localStorage.getItem(profileName);
        if (!item) return;
        if (this.profile.canSync) {
            // set previously selected profile to its latest version, if not already
            this.noti.clear();
            const idx = this.profile.profiles.findIndex(p => p === this.profile.current);
            if (!this.profile.isLatest(idx)) {
                this.profile.currentVersions[idx] = this.profile.versions[idx][0].version;
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
        this.profile.currentVersions[idx] = version;
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
    async keepVersion(name: string, idx: number) {
        const msg = await this.profile.uploadProfile([
            {
                name,
                profile: localStorage.getItem(name)!,
                new: true
            }
        ]);
        if (msg) this.noti.notify(msg);
        localStorage.removeItem('backup-' + name);
        this.noti.clear();
    }
    async renameProfile(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.$set(this.newName, idx, null);
        if (newName !== oldName) {
            if (this.profile.profiles.includes(newName)) return this.noti.error('Duplicated name!');
            const msg = await this.profile.renameProfile(idx, oldName, newName, raw);
            if (msg) return this.noti.notify(msg);
        }
        this.$set(this.newName, idx, null);
    }

    print() {
        window.print();
    }
}
