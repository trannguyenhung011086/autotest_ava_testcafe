let baseUrl: string
let payDollarBase: string
let payDollarApi: string
let stripeKey: string

switch (process.env.NODE_ENV) {
    case 'stg':
        baseUrl = 'https://www.staging.leflair.io'
        payDollarBase = 'https://test.paydollar.com'
        payDollarApi = '/b2cDemo/eng/directPay/payComp.jsp'
        stripeKey = 'pk_test_zrI3lNk5K5ttTT5LumHpDZWy'
        break
    case 'prod':
        baseUrl = 'https://www.leflair.vn'
        payDollarBase = 'https://www.paydollar.com'
        payDollarApi = '/b2c2/eng/directPay/payComp.jsp'
        stripeKey = 'pk_live_2oLGoFep9LLlvVMs1TroLmM1'
        break
    default:
        baseUrl = 'https://www.staging.leflair.io'
        payDollarBase = 'https://test.paydollar.com'
        payDollarApi = '/b2cDemo/eng/directPay/payComp.jsp'
        stripeKey = 'pk_test_zrI3lNk5K5ttTT5LumHpDZWy'
}

let stgRedisHost = '35.240.219.41'
let stgMongo = 'mongodb://35.187.252.42'

if (process.env.MODE == 'ci') {
    stgRedisHost = '10.148.0.45'
    stgMongo = 'mongodb://10.148.0.47'
}

export const config = {
    stgDb: {
        uri: stgMongo,
        name: 'admin-leflair'
    },
    stgRedis: {
        host: stgRedisHost,
        port: 6379
    },
    baseUrl: baseUrl,
    signIn: '/auth/signin',
    signUp: '/auth/register',
    api: {
        signUp: '/api/v2/account/signup',
        signIn: '/api/v2/account/signin',
        signOut: '/api/v2/account/signout',
        forgot: '/api/v2/account/forgot',
        reset: '/api/v2/account/reset',
        password: '/api/v2/account/password',
        subscribe: '/api/v2/news/subscribe',
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
        cateMenu: '/api/menus/code/TOP_NAV?items=true',
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
        feedGoogleMerchant: '/api/v1/google-merchant'
    },
    stripeKey: stripeKey,
    stripeBase: 'https://api.stripe.com',
    payDollarBase: payDollarBase,
    payDollarApi: payDollarApi,
    testAccount: {
        email: 'test1234@test.com',
        password: '123456789',
        facebook: 'trannguyenhung011086@protonmail.com',
        passwordFacebook: '0944226282',
        usedVoucher: 'VCB150'
    },
    notifyMsg: {
        missingEmail: 'Vui lòng nhập email.',
        missingPassword: 'Vui lòng nhập password.',
        invalidEmailPassword: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại',
        invalidEmailFormat: 'Địa chỉ email không đúng',
        passwordLength: 'Mật khẩu phải dài ít nhất 7 ký tự',
        emailExisted: 'Email đã đăng ký. Vui lòng đăng nhập',
        welcome: 'Chào mừng bạn đến với Leflair!'
    }
}