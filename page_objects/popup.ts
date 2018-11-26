import { Browser, Page } from '../common'

export default class Popup extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    public popupWhiteClose = '.ematic_closeExitIntentOverlay_1'
    public popupRedClose = '.ematic_closeExitIntentOverlay_2'
    public popupWhiteCloseMobile = '.ematic_closeExitIntentOverlay_3'
    public popupRedCloseMobile = '.ematic_closeExitIntentOverlay_4'
    public boardingPopup = '.boarding-popup > button'

    public async closeBoardingPopup() {
        try {
            await this.browser.waitForVisible(this.boardingPopup)
            await this.browser.click(this.boardingPopup)
        } catch (error) {
            return
        }
    }

    // need to close Ematic popup which always display for new session on desktop
    public async closePopup(timeout = 5000) {
        await this.closeBoardingPopup()
        try {
            await this.browser.waitForVisible(this.popupWhiteClose, timeout)
            await this.browser.click(this.popupWhiteClose)
        } catch (error) {
            await this.browser.click(this.popupRedClose)
        }
    }

    // need to close Ematic popup which always display for new session on mobile
    public async closePopupMobile(timeout = 5000) {
        await this.closeBoardingPopup()
        try {
            await this.browser.waitForVisible(this.popupWhiteCloseMobile, timeout)
            await this.browser.click(this.popupWhiteCloseMobile)
        } catch (error) {
            await this.browser.click(this.popupRedCloseMobile)
        }
    }
}