import { Browser, Page } from '../common'

export default class Brand extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    public brandTitle = '.title > h1'
    public subcribeText = '.subcribe > .sorry'
    public subcribeBrand = '.subcribe > .brand'
    public subcribeCheck = '.subcribe > .padding'
    public brandFooterName = '.brand-footer > .name'
    public brandFooterDescription = '.brand-footer > .description'

    public async getBrandTitle() {
        return await this.browser.getText(this.brandTitle)
    }

    public async getSubcribeContent() {
        var result = {}
        result['text'] = await this.browser.getText(this.subcribeText)
        result['brand'] = await this.browser.getText(this.subcribeBrand)
        result['check'] = await this.browser.getText(this.subcribeCheck)
        return result
    }

    public async getBrandFooter() {
        await this.browser.scrollTo('#footer')
        var result = {}
        result['name'] = (await this.browser.getText(this.brandFooterName)).replace('Về ', '')
        result['description'] = await this.browser.getText(this.brandFooterDescription)
        return result
    }
}