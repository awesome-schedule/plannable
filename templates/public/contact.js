const submit =
    window.location.host.indexOf('localhost') === -1 &&
    window.location.host.indexOf('127.0.0.1') === -1
        ? `${window.location.protocol}//${window.location.host}/submit`
        : 'http://localhost:8000/submit';

$(document).ready(function() {
    $('#send').click(function() {
        const k = $.get(submit);
        console.log(k);
    });
});
