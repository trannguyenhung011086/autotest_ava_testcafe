import { Browser, Page } from '../common'

export default class ProductList extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    public productList = '.row'
    public productCard = '.product-card'
    public filterNum = 'span[class="jsx-3069017056"]'

    public async getFilterNum() {
        var text = await this.browser.getText(this.filterNum)
        return parseInt(text.split(' ')[0])
    }

    async getNumItems() {
        var els = await this.browser.findElements(this.productCard)
        return els.length
    }

    async getNumLazyLoadItems(numItems: number) {
        await this.browser.scrollTo('#footer')
        await this.browser.findElement(`div:nth-child(${numItems + 30}) > a > ${this.productCard}`)
        await this.browser.scrollTo(this.filterNum)
        return await this.getFilterNum()
    }

    async getProductInfo(index=1) {
        await this.browser.findElement(this.productCard)
        const url = await this.browser.getAttribute(`${this.productList} > .sale-product-list:nth-child(${index}) > a`, 'href')
        const brand = await this.browser.getText(`div:nth-child(${index}) > a > ${this.productCard} > .info > .brand`)
        const title = await this.browser.getText(`div:nth-child(${index}) > a > ${this.productCard} > .info > .title`)
        const retailPrice = await this.browser.getText(`div:nth-child(${index}) > a > ${this.productCard} > .info > .price > .retail`)
        const parsedRetailPrice = parseInt(retailPrice.replace(/\.|₫/g, ''))
        const salePrice = await this.browser.getText(`div:nth-child(${index}) > a > ${this.productCard} > .info > .price > .sale`)
        const parsedSalePrice = parseInt(salePrice.replace(/\.|₫/g, ''))
        const img = await this.browser.getAttribute(`div:nth-child(${index}) > a > ${this.productCard} > .image > div > div > div > img`, 'src')
        const id = url.match(/(?:-)([\w|\d]{24})\??/)[1]
        const info = {
            url: url,
            brand: brand,
            title: title,
            retailPrice: parsedRetailPrice,
            salePrice: parsedSalePrice,
            img: img,
            id: id
        }
        return info
    }
}