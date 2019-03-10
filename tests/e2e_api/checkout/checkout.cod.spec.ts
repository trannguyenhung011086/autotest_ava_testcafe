import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

let account: Model.Account;
let customer: Model.Customer;
let item: Model.Product;
let addresses: Model.Addresses;
let checkoutInput: Model.CheckoutInput = {};

let request = new Utils.CheckoutUtils();
let requestAddress = new Utils.AddressUtils();
let requestAccount = new Utils.AccountUtils();
let requestCart = new Utils.CartUtils();
let requestProduct = new Utils.ProductUtils();
let requestOrder = new Utils.OrderUtils();
let access = new Utils.DbAccessUtils();

import test from "ava";

test.before(async t => {
  t.context["cookie"] = await request.getLogInCookie(
    config.testAccount.email_ex[3],
    config.testAccount.password_ex
  );

  addresses = await requestAddress.getAddresses(t.context["cookie"]);
  account = await requestAccount.getAccountInfo(t.context["cookie"]);
  customer = await access.getCustomerInfo({ email: account.email });
});

test.beforeEach(async t => {
  await requestCart.emptyCart(t.context["cookie"]);
});

test.serial(
  "POST / cannot checkout with COD - international product",
  async t => {
    item = await requestProduct.getInStockProduct(
      config.api.internationalSales,
      1
    );

    await requestCart.addToCart(item.id, t.context["cookie"]);
    account = await requestAccount.getAccountInfo(t.context["cookie"]);

    const res = await request.post(
      config.api.checkout,
      {
        address: {
          shipping: addresses.shipping[0],
          billing: addresses.billing[0]
        },
        cart: account.cart,
        method: "COD"
      },
      t.context["cookie"]
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(
      res.body.message,
      "International orders must be paid by credit card. Please refresh the page and try again."
    );
  }
);

test.serial(
  "POST / cannot checkout with COD - domestic + international product",
  async t => {
    let item1 = await requestProduct.getInStockProduct(
      config.api.internationalSales,
      1
    );
    let item2 = await requestProduct.getInStockProduct(
      config.api.todaySales,
      1
    );

    await requestCart.addToCart(item1.id, t.context["cookie"]);
    await requestCart.addToCart(item2.id, t.context["cookie"]);

    account = await requestAccount.getAccountInfo(t.context["cookie"]);

    const res = await request.post(
      config.api.checkout,
      {
        address: {
          shipping: addresses.shipping[0],
          billing: addresses.billing[0]
        },
        cart: account.cart,
        method: "COD"
      },
      t.context["cookie"]
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(
      res.body.message,
      "International orders must be paid by credit card. Please refresh the page and try again."
    );
  }
);

test.serial("POST / checkout with COD", async t => {
  item = await requestProduct.getInStockProduct(config.api.todaySales, 1);
  await requestCart.addToCart(item.id, t.context["cookie"]);

  checkoutInput.account = await requestAccount.getAccountInfo(
    t.context["cookie"]
  );
  checkoutInput.addresses = addresses;

  let checkout = await request.checkoutCod(checkoutInput, t.context["cookie"]);
  t.snapshot(checkout);
  t.truthy(checkout.orderId);

  let order = await requestOrder.getOrderInfo(
    checkout.orderId,
    t.context["cookie"]
  );

  t.true(order.code.includes(checkout.code));
  t.deepEqual(order.status, "placed");
  t.false(order.isCrossBorder);
  t.deepEqual(order.paymentSummary.method, "COD");
  t.deepEqual(order.paymentSummary.shipping, 25000);
});

test.serial("Compare product details from checkout to order", async t => {
  item = await requestProduct.getProductWithCountry("VN", 0, 2000000);
  let cart = await requestCart.addToCart(item.id, t.context["cookie"]);

  const addresses = await requestAddress.getAddresses(t.context["cookie"]);

  checkoutInput.account = await requestAccount.getAccountInfo(
    t.context["cookie"]
  );
  checkoutInput.addresses = addresses;

  let checkout = await request.checkoutCod(checkoutInput, t.context["cookie"]);
  t.snapshot(checkout);
  t.truthy(checkout.orderId);

  let order = await requestOrder.getOrderInfo(
    checkout.orderId,
    t.context["cookie"]
  );

  t.deepEqual(cart.productContentId, order.products[0].productContentId);
  t.deepEqual(cart.productId, order.products[0].productId);
  t.deepEqual(cart.nsId, order.products[0].nsId);
  t.deepEqual.skip(cart.retailPrice, order.products[0].retailPrice); // wait for WWW-570
  t.deepEqual(cart.salePrice, order.products[0].salePrice);
});

test.serial(
  "POST / checkout with COD - voucher (amount) + credit (skip-prod)",
  async t => {
    if (process.env.NODE_ENV == "prod") {
      t.pass();
    } else {
      let voucher = await access.getNotUsedVoucher(
        {
          expiry: { $gte: new Date() },
          used: false,
          discountType: "amount",
          minimumPurchase: 0,
          numberOfItems: 0,
          customer: { $exists: false },
          numberOfUsage: null,
          binRange: { $exists: false }
        },
        customer
      );

      t.truthy(voucher);

      item = await requestProduct.getInStockProduct(config.api.todaySales, 2);
      await requestCart.addToCart(item.id, t.context["cookie"]);

      const credit = request.calculateCredit(
        account.accountCredit,
        item.salePrice + 25000,
        voucher.amount
      );

      checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
      );
      checkoutInput.addresses = addresses;
      checkoutInput.voucherId = voucher._id;
      checkoutInput.credit = credit;

      let checkout = await request.checkoutCod(
        checkoutInput,
        t.context["cookie"]
      );
      t.snapshot(checkout);
      t.truthy(checkout.orderId);

      let order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
      );

      t.true(order.code.includes(checkout.code));
      t.deepEqual(order.status, "placed");
      t.false(order.isCrossBorder);
      t.deepEqual(order.paymentSummary.method, "COD");
      t.deepEqual(order.paymentSummary.shipping, 25000);
      t.deepEqual(order.paymentSummary.voucherAmount, voucher.amount);
      t.deepEqual(Math.abs(order.paymentSummary.accountCredit), credit);
    }
  }
);

test.serial(
  "POST / checkout with COD - voucher (percentage + max discount) (skip-prod)",
  async t => {
    if (process.env.NODE_ENV == "prod") {
      t.pass();
    } else {
      let voucher = await access.getNotUsedVoucher(
        {
          expiry: { $gte: new Date() },
          used: false,
          discountType: "percentage",
          specificDays: [],
          customer: { $exists: false },
          numberOfItems: 0,
          numberOfUsage: null,
          binRange: { $exists: false }
        },
        customer
      );

      t.truthy(voucher);

      item = await requestProduct.getInStockProduct(
        config.api.todaySales,
        1,
        500000
      );
      await requestCart.addToCart(item.id, t.context["cookie"]);

      checkoutInput.account = await requestAccount.getAccountInfo(
        t.context["cookie"]
      );
      checkoutInput.addresses = addresses;
      checkoutInput.voucherId = voucher._id;

      let checkout = await request.checkoutCod(
        checkoutInput,
        t.context["cookie"]
      );
      t.snapshot(checkout);
      t.truthy(checkout.orderId);

      let order = await requestOrder.getOrderInfo(
        checkout.orderId,
        t.context["cookie"]
      );

      t.true(order.code.includes(checkout.code));
      t.deepEqual(order.status, "placed");
      t.false(order.isCrossBorder);
      t.deepEqual(order.paymentSummary.method, "COD");
      t.deepEqual(order.paymentSummary.shipping, 25000);
      t.true(
        order.paymentSummary.voucherAmount <= voucher.maximumDiscountAmount
      );
    }
  }
);