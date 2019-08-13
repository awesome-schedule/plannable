/**
 * @module components/tabs
 */

/**
 *
 */

import 'bootstrap';
import $ from 'jquery';
import { VueMathjax } from 'vue-mathjax';
import Stepper from '../Stepper.vue';
import { StepperInfo } from '../Stepper';
import { Component, Vue } from 'vue-property-decorator';

import {
    // used in information.vue
    VDivider,
    VImg,
    VLayout,
    VProgressCircular,

    // steppers
    VStepper,
    VStepperContent,
    VStepperHeader,
    VStepperItems,
    VStepperStep
} from 'vuetify/lib';

/**
 * tab for displaying user guide
 * @author Hanzhi Zhou, Kaiying Shan, Zichao Hu, Elena Long
 * @noInheritDoc
 */
@Component({
    components: {
        VueMathjax,

        // used in information.vue
        VDivider,
        VImg,
        VLayout,
        VProgressCircular,

        // steppers
        VStepper,
        VStepperHeader,
        VStepperStep,
        VStepperContent,
        VStepperItems,
        Stepper
    }
})
export default class Information extends Vue {
    e1: number = 0;
    e2: number = 0;
    e3: number = 0;
    e4: number = 0;
    e5: number = 0;
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

    selected = 1;

    readonly scheduleSteps = [
        {
            title: 'Add Classes',
            src: this.imgPath('select_class.gif')
        },
        {
            title: 'Generate Schedules',
            src: this.imgPath('generate_class.gif')
        },
        {
            title: 'Multiple Schedules',
            src: this.imgPath('multiple_schedule.gif')
        }
    ];

    readonly compareSteps = [
        {
            title: '',
            src: this.imgPath('compare1.png')
        },
        {
            title: '',
            src: this.imgPath('compare2.png')
        },
        {
            title: '',
            src: this.imgPath('compare3.png')
        }
    ];

    readonly urlSteps = [
        {
            title: 'Save and share your schedules using URL',
            src: this.imgPath('exportURL1.png')
        },
        {
            title: 'Copy the URL',
            src: this.imgPath('exportURL2.png')
        },
        {
            title: 'Share the URL with others',
            src: this.imgPath('exportURL3.png')
        },
        {
            title: 'Paste the URL here',
            src: this.imgPath('exportURL4.png')
        },
        {
            title: 'There! Your schedule is loaded',
            src: this.imgPath('exportURL5.png')
        }
    ];

    readonly jsonSteps: StepperInfo = [
        {
            title: 'Download Json file',
            src: this.imgPath('exportJson1.png')
        },
        {
            title: 'Save it somewhere you can find',
            src: this.imgPath('exportJson2.png')
        },
        {
            title: 'You can share it with your friends, or just load it on your computer',
            src: this.imgPath('exportJson3.png')
        },
        {
            title: 'Load it!!!',
            src: this.imgPath('exportJson4.png')
        },
        {
            title: 'Boom!! Your schedule is loaded',
            src: this.imgPath('exportJson5.png')
        }
    ];

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

    showGuide(num: number) {
        this.selected = num;
        this.goTop();
    }

    goTop() {
        this.$nextTick(() => {
            window.scrollTo(0, 0);
        });
    }

    mounted() {
        $('body').scrollspy({ target: '#navbar-scrollspy', offset: 50 });
    }

    imgPath(name: string) {
        return require('@/assets/' + name);
    }
}
