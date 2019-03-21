import { t } from "testcafe";
import { config } from "../../../common/config";
import * as faker from "faker/locale/vi";
import { Pages } from "../page_objects";
const page = new Pages();

fixture("Sign up via email")
	.meta({ type: "regression" })
	.page(config.baseUrl + config.signUp)
	.requestHooks(page.base.blockPopup);

test("Cannot sign up with empty email and password", async () => {
	await page.signUp.submitEmpty();
	await t
		.expect(await page.signUp.getEmailError())
		.eql(config.notifyMsg.missingEmail)
		.expect(await page.signUp.getPasswordError())
		.eql(config.notifyMsg.missingPassword);
});

test("Cannot sign up with wrong format email", async () => {
	await page.signUp.submitData(
		".test%!@#$%^&*()_+<>?@mail.com",
		faker.internet.password()
	);
	await t
		.expect(await page.signUp.getEmailError())
		.eql(config.notifyMsg.invalidEmailFormat);
});

test("Cannot sign up with length < 7 password", async () => {
	await page.signUp.submitData(faker.internet.email(), "123456");
	await t
		.expect(await page.signUp.getPasswordError())
		.eql(config.notifyMsg.passwordLength);
});

test("Cannot sign up with existing account", async () => {
	await page.signUp.submitData(
		config.testAccount.email_ex[2],
		config.testAccount.password_ex
	);
	await t
		.expect(await page.signUp.getCommonError())
		.eql(config.notifyMsg.emailExisted);
});

test("Can sign up successfully", async () => {
	await page.signUp.submitData(
		"QA_" + faker.internet.email(),
		faker.internet.password()
	);
	await t
		.expect(await page.signUp.getSuccessMsg())
		.eql(config.notifyMsg.welcome);
});
