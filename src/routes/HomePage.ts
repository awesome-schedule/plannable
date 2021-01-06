/**
 * @module src/routes
 */

/**
 *
 */
import $ from 'jquery';
import { Component, Vue } from 'vue-property-decorator';
import { getReleaseNote } from '@/utils';

@Component
export default class Homepage extends Vue {
    schoolNames = ['Select Your School', 'University Of Virginia'];
    schoolAbbr = ['uva'];
    currentSelect = 0;
    show = false;
    // getnavBarHeight = $('#navbar').outerHeight() | 50;
    navbarHeight = `margin-top: ${$('#navbar').outerHeight()}px`;
    redirection() {
        const index = this.currentSelect - 1;
        if (index < 0) {
            console.log(false);
            return;
        }
        const url = this.schoolAbbr[index];
        location.href = `/${url}`;
    }
    async mounted() {
        console.log('mounted', $('#navbar').outerHeight());
        this.show = true;
        $('#release-note').html(await getReleaseNote());
        // this.navbarHeight = `margin-top: ${$('#navbar').outerHeight()}px`;
    }
    moveTo(id: string) {
        const moveTo = $(id).position().top - $('#navbar').outerHeight()!;
        console.log('moveTo', moveTo);
        console.log('nav h', $('#navbar').outerHeight());
        window.scrollTo(0, moveTo);
    }
}
