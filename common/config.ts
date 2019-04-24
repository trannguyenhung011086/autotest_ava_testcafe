let baseUrl: string;
let payDollarBase: string;
let payDollarApi: string;
let stripeKey: string;
let mongoHost: string;
let redisHost: string;

switch (process.env.NODE_ENV) {
    case "dev1":
        baseUrl = "https://www.dev1.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.247.137.109";
        mongoHost = "mongodb://35.247.137.109";
        break;
    case "dev2":
        baseUrl = "https://www.dev2.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.247.137.109";
        mongoHost = "mongodb://35.247.137.109";
        break;
    case "dev3":
        baseUrl = "https://www.dev3.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.247.137.109";
        mongoHost = "mongodb://35.247.137.109";
        break;
    case "dev4":
        baseUrl = "https://www.dev4.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.247.137.109";
        mongoHost = "mongodb://35.247.137.109";
        break;
    case "stg":
        baseUrl = "https://www.staging.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.240.219.41";
        mongoHost = "mongodb://35.240.219.41";
        break;
    case "prod":
        baseUrl = "https://www.leflair.vn";
        payDollarBase = "https://www.paydollar.com";
        payDollarApi = "/b2c2/eng/directPay/payComp.jsp";
        stripeKey = "pk_live_2oLGoFep9LLlvVMs1TroLmM1";
        redisHost = "35.240.219.41";
        mongoHost = "mongodb://35.240.219.41";
        break;
    default:
        baseUrl = "https://www.staging.leflair.io";
        payDollarBase = "https://test.paydollar.com";
        payDollarApi = "/b2cDemo/eng/directPay/payComp.jsp";
        stripeKey = "pk_test_zrI3lNk5K5ttTT5LumHpDZWy";
        redisHost = "35.240.219.41";
        mongoHost = "mongodb://35.240.219.41";
}

if (process.env.MODE == "ci") {
    redisHost = "10.148.0.45";
    mongoHost = "mongodb://10.148.0.45";
}

export const config = {
    mongo: {
        uri: mongoHost,
        name: "admin-leflair"
    },
    redis: {
        host: redisHost,
        port: 6379
    },
    baseUrl: baseUrl,
    signIn: "/auth/signin",
    signUp: "/auth/register",
    api: {
        signUp: "/api/v2/account/signup",
        signIn: "/api/v2/account/signin",
        signOut: "/api/v2/account/signout",
        forgot: "/api/v2/account/forgot",
        reset: "/api/v2/account/reset",
        password: "/api/v2/account/password",
        subscribe: "/api/v2/news/subscribe",
        account: "/api/v2/account",
        newsletter: "/api/v2/account/subscription",
        addresses: "/api/v2/addresses",
        orders: "/api/v2/user-orders",
        creditcard: "/api/v2/credit-cards",
        giftcard: "/api/v2/giftcards/",
        voucher: "/api/v2/vouchers/",
        voucherApply: "/api/v2/vouchers/apply",
        home: "/api/v2/home",
        product: "/api/v2/product/",
        brands: "/api/v2/brands/",
        campaigns: "/api/v2/campaigns/",
        sales: "/api/v2/sales/",
        secretSales: "/api/v2/secret-sales",
        upcomingSale: "/api/v2/upcoming-sale/",
        upcomingSales: "/api/v2/home/upcoming",
        todaySales: "/api/v2/home/today",
        currentSales: "/api/v2/home/current",
        internationalSales: "/api/v2/home/international",
        featuredSales: "/api/v2/home/featured",
        potdSales: "/api/v2/home/potd",
        bestSellers: "/api/v2/best-sellers/",
        cart: "/api/v2/cart-items/",
        checkout: "/api/v2/checkout",
        mailchimp: "/api/v2/news/mailchimp-report",
        accesstrade: "/api/v2/user-orders/accesstrade",
        feedFacebook: "/api/v1/fb-product-feeds",
        feedGoogle: "/api/v1/google-product-feeds",
        feedGoogleDynamic: "/api/v1/google-dynamic-product-feeds",
        feedCriteo: "/api/v1/criteo",
        feedInsider: "/api/v1/insider",
        feedGoogleMerchant: "/api/v1/google-merchant",
        feedRtbHouse: "/api/v1/rtb-house",
        sitemapIndex: "/sitemap/index.xml",
        sitemapBrands: "/sitemap/brands.xml",
        sitemapCategories: "/sitemap/categories.xml",
        sitemapCategory: "/sitemap/category-",
        menus: "/api/psv/v1/menus/",
        menuSales: "/api/psv/v1/sales/by-menu/",
        menuProducts: "/api/psv/v1/products/by-menu/",
        menuProductVariations: "/api/psv/v1/products/variations/by-menu/"
    },
    stripeKey: stripeKey,
    stripeBase: "https://api.stripe.com",
    payDollarBase: payDollarBase,
    payDollarApi: payDollarApi,
    testAccount: {
        email_in: "qa_tech@leflair.vn",
        password_in: "leflairqa",
        email_ex: [
            "QA_test1234_leflair_0@mailinator.com",
            "QA_test1234_leflair_1@mailinator.com",
            "QA_test1234_leflair_2@mailinator.com",
            "QA_test1234_leflair_3@mailinator.com",
            "QA_test1234_leflair_4@mailinator.com",
            "QA_test1234_leflair_5@mailinator.com",
            "QA_test1234_leflair_6@mailinator.com",
            "QA_test1234_leflair_7@mailinator.com",
            "QA_test1234_leflair_8@mailinator.com",
            "QA_test1234_leflair_9@mailinator.com",
            "QA_test1234_leflair_10@mailinator.com",
            "test1234@test.com",
            "test1234@mail.com"
        ],
        password_ex: "123456789",
        facebook: "trannguyenhung011086@protonmail.com",
        passwordFacebook: "0944226282"
    },
    notifyMsg: {
        missingEmail: "Vui lòng nhập email.",
        missingPassword: "Vui lòng nhập password.",
        invalidEmailPassword:
            "Email hoặc mật khẩu không đúng. Vui lòng thử lại",
        invalidEmailFormat: "Địa chỉ email không đúng",
        passwordLength: "Mật khẩu phải dài ít nhất 7 ký tự",
        emailExisted: "Email đã đăng ký. Vui lòng đăng nhập",
        welcome: "Chào mừng bạn đến với Leflair!"
    }
};
