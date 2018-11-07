import { Browser, Page } from '../common'
import { WebElement } from 'selenium-webdriver';

export default class Popup extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    public popupWhiteClose = '.ematic_closeExitIntentOverlay_1'
    public popupRedClose = '.ematic_closeExitIntentOverlay_2'
    public popupWhiteCloseMobile = '.ematic_closeExitIntentOverlay_3'
    public popupRedCloseMobile = '.ematic_closeExitIntentOverlay_4'

    // need to close Ematic popup which always display for new session on desktop
    public async closePopup() {
        try {
            await this.browser.waitForVisible(this.popupWhiteClose)
            await this.browser.click(this.popupWhiteClose)
        } catch (error) {
            await this.browser.click(this.popupRedClose)
        }
    }

    // need to close Ematic popup which always display for new session on mobile
    public async closePopupMobile() {
        try {
            await this.browser.waitForVisible(this.popupWhiteCloseMobile)
            await this.browser.click(this.popupWhiteCloseMobile)
        } catch (error) {
            await this.browser.click(this.popupRedCloseMobile)
        }
    }
}