/**
 * The data module contains functions for loading data from localStorage or remote
 * @module data
 * @preferred
 */

/**
 * get the origin
 */
export function getApi() {
    return window.location.host.indexOf('localhost') === -1 &&
        window.location.host.indexOf('127.0.0.1') === -1
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://localhost:8000';
}
