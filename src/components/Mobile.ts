// make this a separate component
// if the user in on mobile, then the class viewextends fully

const isMobile = window.screen.width < 900;

const classMobile = isMobile ? 'Mobile' : '';

export default {
    isMobile,
    classMobile
};
