import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let helper = new Utils.Helper();
let access = new Utils.DbAccessUtils();

import test from "ava";

test.beforeEach(async t => {
	t.context["cookie"] = await helper.pickRandomUser(
		config.testAccount.email_ex
	);
});

test("GET / check invalid giftcard", async t => {
	const res = await helper.get(
		config.api.giftcard + "INVALID-ID",
		t.context["cookie"]
	);
	t.snapshot(res.body);

	t.deepEqual(res.statusCode, 500);
	t.deepEqual(res.body.message, "COULD_NOT_LOAD_GIFTCARD_OR_INVALID");
});

test("GET / check redeemed giftcard", async t => {
	const giftcardInfo = await access.getGiftCard({ redeemed: true });

	const res = await helper.get(
		config.api.giftcard + giftcardInfo.code,
		t.context["cookie"]
	);
	t.snapshot(res.body);

	t.deepEqual(res.statusCode, 500);
	t.deepEqual(res.body.message, "COULD_NOT_LOAD_GIFTCARD_OR_INVALID");
});

test("GET / check not redeemed giftcard", async t => {
	const giftcardInfo = await access.getGiftCard({ redeemed: false });

	const res = await helper.get(
		config.api.giftcard + giftcardInfo.code,
		t.context["cookie"]
	);
	t.snapshot(res.body);

	const giftCard: Model.Giftcard = res.body;

	t.deepEqual(res.statusCode, 200);
	t.deepEqual(giftCard.code, giftcardInfo.code);
	t.truthy(giftCard.id);
	t.true(giftCard.amount >= 0);
});

test("GET / cannot check giftcard with invalid cookie", async t => {
	const res = await helper.get(
		config.api.giftcard + "CARD-ID",
		"leflair.connect2.sid=test"
	);
	t.snapshot(res.body);

	t.deepEqual(res.statusCode, 401);
	t.deepEqual(res.body.message, "Access denied.");
});
