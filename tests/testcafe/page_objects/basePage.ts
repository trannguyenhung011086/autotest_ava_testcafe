import { Selector, t } from 'testcafe'

export default class BasePage {
    popupWhiteClose: Selector
    popupRedClose: Selector

    constructor() {
        this.popupWhiteClose = Selector('.ematic_closeExitIntentOverlay_1')
        this.popupRedClose = Selector('.ematic_closeExitIntentOverlay_2')
    }

    public async closePopup() {
        try {
            await t.click(this.popupRedClose)
        } catch (error) {
            await t.click(this.popupWhiteClose)
        }
    }
}