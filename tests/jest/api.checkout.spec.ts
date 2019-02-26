// Jest always run tests in parrallel so import test here to force running in sequence

import {
    CartErrorTest,
    CartSuccessTest,
    CheckoutCodTest,
    CheckoutErrorTest,
    CheckoutPayDollarTest,
    CheckoutProceedLoggedInTest,
    CheckoutProceedGuestTest,
    CheckoutSplitTest,
    CheckoutStripeTest,
    ReCheckoutErrorTest,
    ReCheckoutSuccessTest,
    OrdersConfirmTest,
    OrdersInfoTest
} from './index'

describe('Cart Success Test', CartSuccessTest)
describe('Cart Error Test', CartErrorTest)

describe('Checkout Proceed (Logged In) Test', CheckoutProceedLoggedInTest)
describe('Checkout Proceed (Guest) Test', CheckoutProceedGuestTest)

describe('Checkout Error Test', CheckoutErrorTest)
describe('Checkout COD Test (skip-prod)', CheckoutCodTest)
describe('Checkout PayDollar Test (skip-prod)', CheckoutPayDollarTest)

describe('Checkout Stripe Test (skip-prod)', CheckoutStripeTest)
describe('Checkout Split Order Test (skip-prod)', CheckoutSplitTest)

describe('Re-checkout Error Test (skip-prod)', ReCheckoutErrorTest)
describe('Re-checkout Success Test (skip-prod)', ReCheckoutSuccessTest)

describe('Order Info Test', OrdersInfoTest)
describe('Auto-confirm Order Test (skip-prod)', OrdersConfirmTest)