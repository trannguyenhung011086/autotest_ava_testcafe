let baseUrl: string
let apiNs: string
let payDollarBase: string
let payDollarApi: string

if (process.env.NODE_ENV == 'test') {
    baseUrl = 'https://www.testing.leflair.io'
    payDollarBase = 'https://test.paydollar.com'
    payDollarApi = '/b2cDemo/eng/directPay/payComp.jsp'
} else if (process.env.NODE_ENV == 'stg') {
    baseUrl = 'https://www.staging.leflair.io'
    payDollarBase = 'https://test.paydollar.com'
    payDollarApi = '/b2cDemo/eng/directPay/payComp.jsp'
} else if (process.env.NODE_ENV == 'prod') {
    baseUrl = 'https://www.leflair.vn'
    payDollarBase = 'https://paydollar.com'
    payDollarApi = '/b2c/eng/directPay/payComp.jsp'
} else if (process.env.NODE_ENV == 'stg-ns') {
    baseUrl = 'https://www.staging-ns.leflair.io'
    apiNs = 'https://api.staging-ns.leflair.io'
}

const config = {
    stgDb: {
        uri: 'mongodb://104.199.151.20',
        name: 'admin-leflair'
    },
    baseUrl: baseUrl || 'https://www.staging.leflair.io',
    apiNs: apiNs || 'https://api.staging-ns.leflair.io',
    signIn: '/auth/signin',
    signUp: '/auth/register',
    api: {
        signUp: '/api/v2/account/signup',
        signIn: '/api/v2/account/signin',
        signOut: '/api/v2/account/signout',
        forgot: '/api/v2/account/forgot',
        password: '/api/v2/account/password',
        account: '/api/v2/account',
        addresses: '/api/v2/addresses',
        orders: '/api/v2/user-orders',
        creditcard: '/api/v2/credit-cards',
        giftcard: '/api/v2/giftcards/',
        voucher: '/api/v2/vouchers/',
        home: '/api/v2/home',
        product: '/api/v2/product/',
        brands: '/api/v2/brands/',
        campaigns: '/api/v2/campaigns/',
        sales: '/api/v2/sales/',
        secretSales: '/api/v2/secret-sales',
        upcomingSale: '/api/v2/upcoming-sale/',
        upcomingSales: '/api/v2/home/upcoming',
        todaySales: '/api/v2/home/today',
        currentSales: '/api/v2/home/current',
        internationalSales: '/api/v2/home/international',
        featuredSales: '/api/v2/home/featured',
        potdSales: '/api/v2/home/potd',
        bestSellers: '/api/v2/best-sellers/',
        cateApparel: '/api/menus/items/5b56d3448f0dd7c0480acd1b',
        cateBagsShoes: '/api/menus/items/5b56d3448f0dd7c0480acd1f',
        cateAccessories: '/api/menus/items/5b56d3448f0dd7c0480acd28',
        cateHealthBeauty: '/api/menus/items/5b56d3448f0dd7c0480acd32',
        cateHomeLifeStyle: '/api/menus/items/5b62d1008f0dd7c0480acd5b',
        cart: '/api/v2/cart-items/',
        checkout: '/api/v2/checkout',
        feedFacebook: '/api/v1/fb-product-feeds',
        feedGoogle: '/api/v1/google-product-feeds',
        feedGoogleDynamic: '/api/v1/google-dynamic-product-feeds',
        feedCriteo: '/api/v1/criteo',
        feedInsider: '/api/v1/insider',
        feedGoogleMerchant: '/api/v1/google-merchant',
        subscriberNs: '/v1/subscriber-ns-cache-system-item-management'
    },
    stripeKey: 'pk_test_zrI3lNk5K5ttTT5LumHpDZWy',
    payDollarBase: payDollarBase || 'https://test.paydollar.com',
    payDollarApi: payDollarApi || '/b2cDemo/eng/directPay/payComp.jsp',
    testAccount: {
        email: 'test1234@test.com',
        password: '123456789',
        facebook: 'trannguyenhung011086@protonmail.com',
        passwordFacebook: '0944226282',
        usedVoucher: 'VCB150'
    },
    remote: process.env.SELENIUM_REMOTE_URL || 'http://localhost:4444/wd/hub',
    browser: process.env.SELENIUM_BROWSER || 'chrome',
    device: process.env.DEVICE || 'iPhone 6'
}

export default config