/**
 * the methods associated when the user is on mobile
 * @author Zichao Hu
 */

// make this a separate component
// if the user in on mobile, then the class view extends fully
// if the user clicks on the generate btn, then the view retrieve
import status from '../store/status';

const isMobile = window.screen.width < 900;

const classMobile = isMobile ? 'Mobile' : '';
console.log('ismobile',isMobile);
const foldView = () => {
    if (isMobile) status.offAllSideBar();
};

export default {
    isMobile,
    classMobile,
    foldView
};
