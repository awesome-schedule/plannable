/**
 * The data module contains functions for loading data from localStorage or remote
 * @module data
 * @preferred
 */

/**
 * get the origin
 */
export function getApi() {
    if (
        window.location.host.indexOf('localhost') !== -1 ||
        window.location.host.indexOf('127.0.0.1') !== -1
    ) {
        return 'http://localhost:8000'; // local development
    } else if (window.location.protocol === 'file:') {
        return `https://plannable.org/`; // electron?
    } else {
        return `${window.location.protocol}//${window.location.host}`; // other: plannable.org or plannable.gitee.io
    }
}
