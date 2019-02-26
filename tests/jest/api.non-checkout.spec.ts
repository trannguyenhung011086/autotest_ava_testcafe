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
    CategoryTest,
    CreditCardTest,
    GiftcardTest,
    ProductFeedsTest,
    ProductInfoTest,
    SaleInfoTest,
    SaleListTest,
    SecretSaleTest,
    NewsSubscribeTest,
    VoucherTest
} from './index'

describe('Category Test', CategoryTest)

describe('Best Sellers Test', BestSellersTest)

describe('Sale List Test', SaleListTest)
describe('Sale Info Test', SaleInfoTest)

describe('Brand Info Test', BrandInfoTest)

describe('Product Info Test', ProductInfoTest)

describe('Campaign Info Test', CampaignInfoTest)
describe('Secret Sale Test', SecretSaleTest)

describe('Creditcard Info Test', CreditCardTest)

describe('Voucher Test', VoucherTest)
describe('Gift Card Test', GiftcardTest)

describe('News Subscribe Test', NewsSubscribeTest)

describe('Account Info Test', AccountInfoTest)
describe('Account Forgot Test', AccountForgotTest)
describe('Account Reset Test', AccountResetTest)
describe('Account Sign In Test', AccountSignInTest)
describe('Account Sign Up Test', AccountSignUpTest)
describe('Account Update Info Test', AccountUpdateInfoTest)
describe('Account Update Password Test', AccountUpdatePasswordTest)

describe('Addresses Error Test', AddressesErrorTest)
describe('Addresses Success Test', AddressesSuccessTest)

describe('Product Feeds Test', ProductFeedsTest)