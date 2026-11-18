import { MOBILE_LANDSCAPE, DESKTOP_UP, LARGE_DESKTOP } from './constants.js';

export {
    SPECTRUM_MOBILE_LANDSCAPE,
    MOBILE_LANDSCAPE,
    TABLET_DOWN,
    TABLET_UP,
    DESKTOP_UP,
    LARGE_DESKTOP,
    C2_DESKTOP_UP,
    XL_DESKTOP_UP,
} from './constants.js';

const Media = {
    matchMobile: window.matchMedia(MOBILE_LANDSCAPE),
    matchDesktop: window.matchMedia(`${DESKTOP_UP} and (not ${LARGE_DESKTOP})`),
    matchDesktopOrUp: window.matchMedia(DESKTOP_UP),
    matchLargeDesktop: window.matchMedia(LARGE_DESKTOP),
    get isMobile() {
        return this.matchMobile.matches;
    },
    get isDesktop() {
        return this.matchDesktop.matches;
    },
    get isDesktopOrUp() {
        return this.matchDesktopOrUp.matches;
    },
};

export default Media;

export function isDesktop() {
    return Media.isDesktop;
}
