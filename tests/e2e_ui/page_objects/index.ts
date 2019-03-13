import { BasePage } from "./basePage";
import { SignInPage } from "./signInPage";
import { SignUpPage } from "./signUpPage";
import { ProductPage } from "./productPage";

export class Pages {
    base: BasePage;
    signIn: SignInPage;
    signUp: SignUpPage;
    product: ProductPage;

    constructor() {
        this.base = new BasePage();
        this.signIn = new SignInPage();
        this.signUp = new SignUpPage();
        this.product = new ProductPage();
    }
}
