let baseUrl: string
let cookieEma: string[]

if (process.env.NODE_ENV == 'testing') {
    baseUrl = 'https://www.testing.leflair.io'
    cookieEma = [
        '_v1EmaticSolutions=%5B%227b54c3c7-d8ce-11e8-9fef-0242ac160003%22%2C1540541603423%2C%5B%22A%22%2C%22Th%E1%BB%9Di%20Trang%20N%E1%BB%AF%22%2C2%2C%22thoi-trang-nu-5b56d3448f0dd7c0480acd1c%22%5D%5D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-23T10:50:45.000Z',
        '_v1EmaticSolutionsBye=%7B%2215586%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-16%22%2C%22loop%22%3A0%7D%7D%2C%2215589%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-15%22%2C%22loop%22%3A0%7D%7D%2C%2215590%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-16%22%2C%22loop%22%3A0%7D%7D%7D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z',
        '_v1EmaticSolutionsEI=%7B%22c_15586_1%22%3A%5B1%2C1539073934509%2C0%5D%2C%22c_15589_2%22%3A%5B1%2C1538991676673%2C0%5D%2C%22c_15590_3%22%3A%5B1%2C1539051620006%2C0%5D%7D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z'
    ]
} else if (process.env.NODE_ENV == 'staging') {
    baseUrl = 'https://www.staging.leflair.io'
    cookieEma = [
        '_v1EmaticSolutions=%5B%22ebc6ba2d-cad9-11e8-b5ef-0242ac160003%22%2C1538991480919%2C%5B%22A%22%2C%22T%C3%A0i%20kho%E1%BA%A3n%22%2C1%5D%5D; Domain=.staging.leflair.io; Path=/; Expires=2020-09-23T10:50:45.000Z',
        '_v1EmaticSolutionsBye=%7B%2215586%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-15%22%2C%22loop%22%3A0%7D%7D%2C%2215589%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-15%22%2C%22loop%22%3A0%7D%7D%2C%2215590%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-15%22%2C%22loop%22%3A0%7D%7D%2C%2216371%22%3A%7B%2217262%22%3A%7B%22dont_show_till%22%3A%222018-10-19%22%2C%22loop%22%3A0%7D%7D%2C%2216376%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-26%22%2C%22loop%22%3A0%7D%7D%2C%2216377%22%3A%7B%2217268%22%3A%7B%22dont_show_till%22%3A%222018-10-19%22%2C%22loop%22%3A0%7D%7D%7D; Domain=.staging.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z',
        '_v1EmaticSolutionsEI=%7B%22c_15586_1%22%3A%5B1%2C1538989900707%2C0%5D%2C%22c_15589_2%22%3A%5B1%2C1538989797970%2C0%5D%2C%22c_15590_3%22%3A%5B1%2C1538990011889%2C0%5D%2C%22c_16371_1%22%3A%5B0%2C1539923866798%2C0%5D%2C%22c_16376_2%22%3A%5B1%2C1539923871882%2C0%5D%2C%22c_16377_3%22%3A%5B0%2C1539923866880%2C0%5D%7D; Domain=.staging.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z'
    ]
} else if (process.env.NODE_ENV == 'production') {
    baseUrl = 'https://www.leflair.vn'
    cookieEma = [
        '_v1EmaticSolutions=%5B%22f53893b9-d8ca-11e8-9fef-0242ac160003%22%2C1540522746687%2C%5B%22IMG%22%2C%22%22%2C0%2C%22leflair-logo-black.png%22%5D%5D; Domain=.leflair.vn; Path=/; Expires=2020-09-23T10:50:45.000Z',
        '_v1EmaticSolutionsBye=%7B%2215586%22%3A%7B%2216326%22%3A%7B%22dont_show_till%22%3A%222018-10-18%22%2C%22loop%22%3A0%7D%7D%2C%2215589%22%3A%7B%2216348%22%3A%7B%22dont_show_till%22%3A%222018-10-18%22%2C%22loop%22%3A0%7D%7D%2C%2215590%22%3A%7B%2216349%22%3A%7B%22dont_show_till%22%3A%222018-10-18%22%2C%22loop%22%3A0%7D%7D%2C%2216371%22%3A%7B%2217262%22%3A%7B%22dont_show_till%22%3A%222018-10-18%22%2C%22loop%22%3A0%7D%7D%2C%2216376%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-25%22%2C%22loop%22%3A0%7D%7D%2C%2216377%22%3A%7B%2217268%22%3A%7B%22dont_show_till%22%3A%222018-10-18%22%2C%22loop%22%3A0%7D%7D%7D; Domain=.leflair.vn; Path=/; Expires=2020-09-15T03:10:32.000Z',
        '_v1EmaticSolutionsEI=%7B%22c_15586_1%22%3A%5B0%2C1539830640090%2C0%5D%2C%22c_15589_2%22%3A%5B0%2C1539830640146%2C0%5D%2C%22c_15590_3%22%3A%5B0%2C1539830640198%2C0%5D%2C%22c_16371_1%22%3A%5B0%2C1539920765860%2C0%5D%2C%22c_16376_2%22%3A%5B1%2C1539846119273%2C0%5D%2C%22c_16377_3%22%3A%5B0%2C1539920765893%2C0%5D%2C%22416050dba26511e796c00242ac110002-sg4_cartEmpty%22%3A0%7D; Domain=.leflair.vn; Path=/; Expires=2020-09-15T03:10:32.000Z'
    ]
}

const config = {
    stagingDb: {
        uri: 'mongodb://104.199.151.20',
        name: 'admin-leflair'
    },
    baseUrl: baseUrl || 'https://www.staging.leflair.io',
    signin: '/auth/signin',
    register: '/auth/register',
    api: {
        register: '/api/v2/account/signup',
        login: '/api/v2/account/signin',
        logout: '/api/v2/account/signout',
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
        sales: '/api/v2/sales/',
        upcomingSale: '/api/v2/upcoming-sale/',
        upcomingSales: '/api/v2/home/upcoming',
        todaySales: '/api/v2/home/today',
        currentSales: '/api/v2/home/current',
        internationalSales: '/api/v2/home/international',
        featuredSales: '/api/v2/home/featured',
        potdSales: '/api/v2/home/potd',
        bestSellers: '/api/v2/best-sellers/',
        trendingApparel: '/api/menus/items/5b56d3448f0dd7c0480acd1b/sales/current?today=false&limit=5',
        trendingBagsShoes: '/api/menus/items/5b56d3448f0dd7c0480acd1f/sales/current?today=false&limit=5',
        trendingAccessories: '/api/menus/items/5b56d3448f0dd7c0480acd28/sales/current?today=false&limit=5',
        trendingHealthBeauty: '/api/menus/items/5b56d3448f0dd7c0480acd32/sales/current?today=false&limit=5',
        trendingHomeLifestyle: '/api/menus/items/5b62d1008f0dd7c0480acd5b/sales/current?today=false&limit=5',
        cart: '/api/v2/cart-items/',
        checkout: '/api/v2/checkout'
    },
    testAccount: {
        email: 'test1234@test.com',
        password: '123456789',
        facebook: 'trannguyenhung011086@protonmail.com',
        passwordFacebook: '0944226282',
        usedVoucher: 'VCB150'
    },
    cookieEma: cookieEma || [
        '_v1EmaticSolutions=%5B%227b54c3c7-d8ce-11e8-9fef-0242ac160003%22%2C1540541603423%2C%5B%22A%22%2C%22Th%E1%BB%9Di%20Trang%20N%E1%BB%AF%22%2C2%2C%22thoi-trang-nu-5b56d3448f0dd7c0480acd1c%22%5D%5D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-23T10:50:45.000Z',
        '_v1EmaticSolutionsBye=%7B%2215586%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-16%22%2C%22loop%22%3A0%7D%7D%2C%2215589%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-15%22%2C%22loop%22%3A0%7D%7D%2C%2215590%22%3A%7B%22-1%22%3A%7B%22dont_show_till%22%3A%222018-10-16%22%2C%22loop%22%3A0%7D%7D%7D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z',
        '_v1EmaticSolutionsEI=%7B%22c_15586_1%22%3A%5B1%2C1539073934509%2C0%5D%2C%22c_15589_2%22%3A%5B1%2C1538991676673%2C0%5D%2C%22c_15590_3%22%3A%5B1%2C1539051620006%2C0%5D%7D; Domain=.testing.leflair.io; Path=/; Expires=2020-09-15T03:10:32.000Z'
    ],
    remote: process.env.SELENIUM_REMOTE_URL || 'http://localhost:4444/wd/hub',
    browser: process.env.SELENIUM_BROWSER || 'chrome',
    device: process.env.DEVICE || 'iPhone 6'
}

export default config