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

    public async closePopup() {
        var el: WebElement
        try {
            await this.browser.waitForVisible(this.popupWhiteClose)
            await this.browser.click(this.popupWhiteClose)
        } catch (e) {
            await this.browser.click(this.popupRedClose)
        }
    }

    public async closePopupMobile() {
        var el: WebElement
        try {
            await this.browser.waitForVisible(this.popupWhiteCloseMobile)
            await this.browser.click(this.popupWhiteCloseMobile)
        } catch (e) {
            await this.browser.click(this.popupRedCloseMobile)
        }
    }
}