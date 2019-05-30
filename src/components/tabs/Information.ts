/**
 * @module components/tabs
 */
// tslint:disable:max-line-length
import { Vue, Component, Prop } from 'vue-property-decorator';
import { VueMathjax } from 'vue-mathjax';
import 'bootstrap';
import $ from 'jquery';

@Component({
    components: {
        VueMathjax
    }
})
export default class Information extends Vue {
    @Prop(Number) readonly scheduleLeft!: number;
    e1: number = 0;
    e2: number = 0;
    formula = `
    $$
    \\begin{align*}
        \\text{Variance}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}}
        \\frac{\\text{Classtime}(day)^2}{5} - \\left( \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\frac{\\text{Classtime}(day)}{5} \\right)^2                             \\\\
        \\text{Compactness} & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day} - 1} \\left(\\text{Start}_{i + 1} - \\text{End}_{i} \\right)            \\\\
                        & \\text{where $n_{day}$ is the number of classes at day $day$}                                                                         \\\\
        \\text{No Early}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\max \\left(0, \\text{12:00} - \\text{FirstClassStart} \\right)                                                 \\\\
        \\text{Lunch time}  & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day}} \\min(\\text{OverlapBetween}(\\text{Class}_i, \\text{Lunch}), 60) - 60 \\\\
                        & \\text{where Lunch is defined as the time between 11:00 and 14:00}                                                                    \\\\
        \\text{Distance}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day} - 1} \\text{DistanceBetween}(\\text{Class}_i, \\text{Class}_{i+1})
    \\end{align*}
    $$
`;

    readonly icalSteps = [
        {
            title: 'Make Your Schedule and Export',
            src: this.imgPath('export1.png')
        },
        {
            title: 'Save The File Somewhere You Can Find',
            src: this.imgPath('export2.png')
        },
        {
            title: 'Go to Google Calendar',
            src: this.imgPath('export3.png')
        },
        {
            title: 'Click on Setting',
            src: this.imgPath('export4.png')
        },
        {
            title: 'Select Import and Export',
            src: this.imgPath('export5.png')
        },
        {
            title: 'Find and Open The File You Just Saved',
            src: this.imgPath('export6.png')
        },
        {
            title: 'Import',
            src: this.imgPath('export7.png')
        },
        {
            title: 'Import Successful!',
            src: this.imgPath('export8.png')
        },
        {
            title: 'Now You Can View Your Schedule On Google Calendar!',
            src: this.imgPath('export9.png')
        }
    ];

    mounted() {
        $('body').scrollspy({ target: '#navbar-scrollspy', offset: 50 });
    }

    imgPath(name: string) {
        return require('@/assets/' + name);
    }
}
