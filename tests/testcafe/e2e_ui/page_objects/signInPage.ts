import { Selector, t } from 'testcafe'

export default class SignInPage {
    formHeader: Selector
    emailField: Selector
    passwordField: Selector
    submitBtn: Selector
    commonError: Selector
    successMsg: Selector
    emailError: Selector
    passwordError: Selector

    constructor() {
        this.formHeader = Selector('.form-header-title')
        this.emailField = Selector('input[type="email"]')
        this.passwordField = Selector('input[type="password"]')
        this.submitBtn = Selector('button[type="submit"]')
        this.commonError = Selector('.alert-danger')
        this.successMsg = Selector('.welcome-back-notify')
        this.emailError = Selector('.form-group:nth-child(1) > .invalid-feedback')
        this.passwordError = Selector('.form-group:nth-child(2) > .invalid-feedback')
    }

    public async submitData(email: string, password: string) {
        await t
            .typeText(this.emailField, email)
            .typeText(this.passwordField, password)
            .click(this.submitBtn)
    }

    public async submitEmpty() {
        await t
            .typeText(this.emailField, ' ')
            .click(this.submitBtn)
    }

    public async getEmailError() {
        return (await this.emailError.textContent).trim()
    }

    public async getPasswordError() {
        return (await this.passwordError.textContent).trim()
    }

    public async getCommonError() {
        return (await this.commonError.textContent).trim()
    }

    public async getSuccessMsg() {
        return (await this.successMsg.textContent).trim()
    }
}