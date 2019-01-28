import { Selector, t, RequestMock } from 'testcafe'

export default class BasePage {
    blockPopup: RequestMock

    constructor() {
        this.blockPopup = RequestMock()
            .onRequestTo('https://api.ematicsolutions.com/v1/ematic.min.js')
            .respond(null, 500)
    }
}