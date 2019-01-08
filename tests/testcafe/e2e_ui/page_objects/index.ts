import BasePage from './basePage'
import SignInPage from './signInPage'
import SignUpPage from './signUpPage'

export {
    BasePage,
    SignInPage,
    SignUpPage
}

export default class Pages {
    base: BasePage
    signIn: SignInPage
    signUp: SignUpPage

    constructor() {
        this.base = new BasePage()
        this.signIn = new SignInPage()
        this.signUp = new SignUpPage()
    }
}