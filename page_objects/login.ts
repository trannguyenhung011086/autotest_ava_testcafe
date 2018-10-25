import { Browser, Page } from '../common'

export default class Login extends Page {
    constructor(browser: Browser) {
        super(browser)
    }

    public emailField = 'input[type="email"]'
    public passwordField = 'input[type="password"]'
    public submitBtn = 'button[type="submit"]'
    public errorMsg = '.alert-danger'
    public successNotify = '.welcome-back-notify'
    public femaleBtn = '#option1'
    public maleBtn = '#option2'
    public emailError = '.form-group:nth-child(1) > .invalid-feedback'
    public passwordError = '.form-group:nth-child(2) > .invalid-feedback'

    public async submitWithEmail(email: string, password: string) {
        await this.browser.type(this.emailField, email)
        await this.browser.type(this.passwordField, password)
        await this.browser.click(this.submitBtn)
    }

    async getErrorText() {
        return this.browser.getText(this.errorMsg)
    }

    async getSuccessText() {
        return this.browser.getText(this.successNotify)
    }

    async getEmailError() {
        return this.browser.getText(this.emailError)
    }
    
    async getPasswordError() {
        return this.browser.getText(this.passwordError)
    }
}