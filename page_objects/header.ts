import { Browser, Page } from '../common'

export default class Header extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    // for desktop theme
    public switchLanguage = '.dropdown-button.switch-language'
    public switchVN = `${this.switchLanguage} > .content > .dropdown-item:nth-child(1)`
    public switchEN = `${this.switchLanguage} > .content > .dropdown-item:nth-child(2)`
    public accountMenu = '.dropdown-button:nth-child(3)'
    public accountSetting = `${this.accountMenu} > .content > div > a:nth-child(1)`
    public orderManage = `${this.accountMenu} > .content > div > a:nth-child(2)`
    public addressManage = `${this.accountMenu} > .content > div > a:nth-child(3)`
    public cardManage = `${this.accountMenu} > .content > div > a:nth-child(4)`
    public logOutBtn = `${this.accountMenu} > .content > div > div`
    public logInBtn = '.nav-bar-link:nth-child(2)'
    public registerBtn = '.nav-bar-link:nth-child(3)'
    
    // for mobile theme
    public menuIcon = '.menu-icon > svg'
    public cartIcon = '.cart-icon > svg'
    public brandIcon = '.navbar-brand'
    public logOutBtnMobile = '.menu-item > .menu-header'
    public logInBtnMobile = '.menu-item > a:nth-child(1) > .menu-header'
    public registerBtnMobile = '.menu-item > a:nth-child(2) > .menu-header'
    public switchLanguageMobile = '.language-switcher-item'
    public switchVNMobile = `${this.switchLanguageMobile} > div > .menu-content > div:nth-child(1)`
    public switchENMobile = `${this.switchLanguageMobile} > div > .menu-content > div:nth-child(2)`

    public async getLangActive() {
        return await this.browser.getText(`${this.switchLanguage} > div`)
    }

    public async getLangActiveMobile() {
        await this.browser.click(this.menuIcon)
        await this.browser.scrollClick(this.switchLanguageMobile)
        const active = await this.browser.getText(`${this.switchLanguageMobile} > div > div`)
        return active
    }

    public async switchToVn() {
        await this.browser.click(this.switchLanguage)
        await this.browser.click(this.switchVN)
    }

    public async switchToVnMobile() {
        await this.browser.click(this.menuIcon)
        await this.browser.scrollClick(this.switchLanguageMobile)
        await this.browser.scrollClick(this.switchVNMobile)
    }

    public async switchToEn() {
        await this.browser.click(this.switchLanguage)
        await this.browser.click(this.switchEN)
    }

    public async switchToEnMobile() {
        await this.browser.click(this.menuIcon)
        await this.browser.scrollClick(this.switchLanguageMobile)
        await this.browser.scrollClick(this.switchENMobile)
    }

    public async logOut() {
        await this.browser.click(this.accountMenu)
        await this.browser.click(this.logOutBtn)
    }

    public async logOutMobile() {
        await this.browser.click(this.menuIcon)
        await this.browser.scrollClick(this.logOutBtnMobile)
    }
}