import axios from 'axios';
import { Component, Prop, Vue } from 'vue-property-decorator';
import VersionModal from '../components/VersionModal';

let note = 'loading release note...';

/**
 * Get release note for current version && render.
 * Part of this function can be seen as an extremely-lightweight MarkDown renderer.
 * @author Kaiying Cat
 */
async function releaseNote() {
    try {
        const res = await axios.get(
            'https://api.github.com/repos/awesome-schedule/plannable/releases'
        );

        /**
         * Records the # of layers (of "ul") that this line is at.
         * Denoted by the number of spaces before a "- " in the front of the current line.
         * If this line is not in an "ul", it will be set to -1 at the end of the callback function
         * in .map()'s parameter.
         */
        let ul = -1;
        note = (res.data[0].body as string)
            .split(/[\r\n]+/)
            .map(x => {
                /**
                 * Records the number corresponds to the largeness of header.
                 * It is 0 if this line is not a header.
                 */
                let head = 0;
                /**
                 * Records if this line is in an "ul" or not by checking if this line starts with "- ";
                 */
                let li = 0;
                let result =
                    x
                        .replace(/^(#*)(\s)/, (s1: string, match1: string, match2: string) => {
                            /**
                             * Replace # to <h1> (and so on...) and set the variable "header",
                             * so that "header" can be used
                             * to close this element (give it a "</h1>")
                             */
                            return match1.length === 0
                                ? match2
                                : '<h' + (head = match1.length) + '>';
                        })
                        .replace(/^(\s*)-\s/, (s: string, match: string) => {
                            /**
                             * Replace "- Cats are the best" with "<li>Cats are the best</li>"
                             * Set appropriate list group information
                             */
                            if (head !== 0) return match + '- ';
                            let tag = '';
                            if (match.length > ul) {
                                tag = '<ul>';
                            } else if (match.length < ul) {
                                tag = '</ul>';
                            }
                            ul = match.length;
                            li = 1;
                            return `${tag}<li>`;
                        })
                        .replace(/!\[([\w -]+)\]\(([\w -/:]+)\)/, (s, match1: string, match2) => {
                            // convert md image to html
                            return `<img src=${match2} alt=${match1}></img>`;
                        })
                        .replace('<img', '<img class="img-fluid my-3" ') +
                    (head === 0
                        ? li === 0
                            ? /<\/?\w+>/.exec(x)
                                ? ''
                                : '<br />'
                            : '</li>'
                        : `</h${head}>`);
                if (li === 0 && ul !== -1) {
                    // append "</ul>"s according to the variable "ul"
                    result = '</ul>'.repeat(ul / 4 + 1) + result;
                    ul = -1;
                }
                return result;
            })
            .join(' ');
    } catch (err) {
        note =
            'Failed to obtain release note.' +
            ' See https://github.com/awesome-schedule/plannable/releases instead.';
    }
}
@Component({
    components: {
        VersionModal
    }
})
export default class Homepage extends Vue {
    schoolNames = ['Select Your School', 'University Of Virginia'];
    schoolAbbr = ['uva'];
    currentSelect = 0;
    show = false;
    navbarHeight = '10vh';
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
        this.show = true;
        await releaseNote();
        $('#release-note').html(note);
        this.navbarHeight = `margin-top: ${$('#navbar').outerHeight()}px`;
    }
}
