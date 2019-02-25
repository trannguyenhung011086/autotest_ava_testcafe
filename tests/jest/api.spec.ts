// Jest always run tests in parrallel so import test here to force running in sequence

import {
    AccountForgotTest,
    AccountResetTest,
    AccountSignInTest,
    AccountSignUpTest,
    AccountInfoTest,
    AccountUpdateInfoTest,
    AccountUpdatePasswordTest,
    AddressesErrorTest,
    AddressesSuccessTest,
    BestSellersTest,
    BrandInfoTest,
    CampaignInfoTest,
    CartErrorTest,
    CartSuccessTest,
    CategoryTest,
    CheckoutCodTest,
    CheckoutErrorTest,
    CheckoutPayDollarTest,
    CheckoutProceedLoggedInTest,
    CheckoutProceedGuestTest,
    CheckoutSplitTest,
    CheckoutStripeTest,
    ReCheckoutErrorTest,
    ReCheckoutSuccessTest,
    CreditCardTest,
    GiftcardTest,
    OrdersConfirmTest,
    OrdersInfoTest,
    ProductFeedsTest,
    ProductInfoTest,
    SaleInfoTest,
    SaleListTest,
    SecretSaleTest,
    NewsSubscribeTest,
    VoucherTest
} from './index'

describe('Account Info Test', AccountInfoTest)
describe('Account Forgot Test', AccountForgotTest)
describe('Account Reset Test', AccountResetTest)
describe('Account Sign In Test', AccountSignInTest)
describe('Account Sign Up Test', AccountSignUpTest)
describe('Account Update Info Test', AccountUpdateInfoTest)
describe('Account Update Password Test', AccountUpdatePasswordTest)

describe('Addresses Error Test', AddressesErrorTest)
describe('Addresses Success Test', AddressesSuccessTest)

describe('Category Test', CategoryTest)

describe('Best Sellers Test', BestSellersTest)

describe('Sale List Test', SaleListTest)
describe('Sale Info Test', SaleInfoTest)

describe('Brand Info Test', BrandInfoTest)

describe('Product Info Test', ProductInfoTest)

describe('Campaign Info Test', CampaignInfoTest)
describe('Secret Sale Test', SecretSaleTest)

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

describe('Creditcard Info Test', CreditCardTest)

describe('Order Info Test', OrdersInfoTest)
describe('Auto-confirm Order Test (skip-prod)', OrdersConfirmTest)

describe('Voucher Test', VoucherTest)
describe('Gift Card Test', GiftcardTest)

describe('News Subscribe Test', NewsSubscribeTest)

describe('Product Feeds Test', ProductFeedsTest)