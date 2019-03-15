import { Selector, t } from "testcafe";
import { SignInPage } from "./signInPage";

export class SignUpPage extends SignInPage {
	femaleBtn: Selector;
	maleBtn: Selector;

	constructor() {
		super();
		this.femaleBtn = Selector("#option1");
		this.maleBtn = Selector("#option2");
	}

	public async test() {
		this.submitData;
	}
}
