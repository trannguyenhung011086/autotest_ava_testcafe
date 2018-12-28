import config from '../../config/config'
import * as Utils from '../../common/utils'
import Puppeteer from 'puppeteer'
let browser: Puppeteer.Browser
let page: Puppeteer.Page
let api = new Utils.ApiUtils()
import * as model from '../../common/interface'
let sales: model.SalesModel[]

let testData = {
    "id": "5c121878dbef94eb70ecf000",
    "sale": {
        "id": "5c17254c56768451e3ec0365",
        "title": "Marc Thời Trang Nữ",
        "slug": "marc-thoi-trang-nu-5c17254c56768451e3ec0365",
        "startTime": "2018-12-27T01:18:00.000Z",
        "endTime": "2019-01-03T01:00:00.000Z",
        "potd": false,
        "categories": [
            "Women"
        ]
    },
    "brand": {
        "logo": "https://leflair-assets.storage.googleapis.com/5b2a14bf4a0cb800016dd52f.jpg",
        "name": "Marc",
        "description": "Ra đời vào năm 2006, trực thuộc công ty TNHH SX-TM Nét Việt được các bạn trẻ biết đến với dòng sản phẩm áo sơ mi kiểu với nhiều kiểu dáng và màu sắc tươi sáng, trẻ trung.\nKhởi nguồn từ đam mê thời trang, khát khao mang đến cái đẹp cho tất cả các bạn nữ và hơn thế nữa là mong muốn tạo dựng được hình ảnh mới lạ cho ngành công nghiệp thời trang, thương hiệu thời trang Marc đã đa dạng hóa các sản phẩm của mình với phương châm “BE YOUR STYLE” – Hãy là phong cách của chính bạn. Marc mong muốn mang đến cho khách hàng những sản phẩm tốt nhất để các bạn có thể tự tin hơn trên con đường chọn lựa phong cách thời trang của riêng mình."
    },
    "title": "Áo Ren Cotton Dệt Ô Vuông Viền Bèo",
    "returnable": true,
    "returnDays": 7,
    "images": {
        "TRANG": [
            "5c22f8d5a835c144dbf872fe.jpg",
            "5c22f8d57ddb0a77aefa3323.jpg",
            "5c22f8d59890960b518bace8.jpg"
        ]
    },
    "products": [
        {
            "id": "5c121878dbef941887eceffd",
            "size": "S",
            "color": "TRANG",
            "retailPrice": 455000,
            "salePrice": 289000,
            "saleId": "5c17254c56768451e3ec0365",
            "inStock": true,
            "imageKey": "TRANG",
            "quantity": 9,
            "isVirtual": true,
            "isBulky": false,
            "nsId": "202566",
            "cachingItem": null
        }
    ],
    "sizeChart": [
        {
            "name": "Size sản phẩm",
            "values": [
                "S",
                "M",
                "L"
            ]
        }
    ],
    "sizes": [
        {
            "name": "S",
            "soldOut": false,
            "availableColors": [
                "TRANG"
            ],
            "quantity": 9
        }
    ],
    "colors": [
        {
            "hex": "",
            "name": "TRANG",
            "soldOut": false,
            "availableSizes": [
                "S",
                "M",
                "L"
            ]
        }
    ]
}

describe('Intercept requests at product page - API return error ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        })
        page = await browser.newPage()
        sales = await api.getSales(config.api.featuredSales)
    })

    afterAll(async () => {
        await browser.close()
    })

    test('API return error', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url().match(/\/api\/v2\/product\/(?!view-product)/)) {
                request.respond({ status: 403, body: JSON.stringify({ "code": 403 }) })
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl + '/vn/sales/' + sales[0].slug)
        await page.click('.product-card')
        await page.waitForNavigation()
        expect(await page.url()).toEqual(config.baseUrl + '/vn')
    })
})

describe('Intercept requests at product page - missing description field ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        })
        page = await browser.newPage()
        sales = await api.getSales(config.api.featuredSales)
    })

    afterAll(async () => {
        await browser.close()
    })

    test('missing description field', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url().match(/\/api\/v2\/product\/(?!view-product)/)) {
                request.respond({
                    contentType: 'application/json',
                    body: JSON.stringify(testData)
                })
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl + '/vn/sales/' + sales[0].slug)
        await page.click('.product-card')

        expect(await page.$('.product-content')).not.toBeNull()
    })
})

describe('Intercept requests at product page - empty description ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        })
        page = await browser.newPage()
        sales = await api.getSales(config.api.featuredSales)
        testData['description'] = {}
    })

    afterAll(async () => {
        await browser.close()
    })

    test('empty description', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url().match(/\/api\/v2\/product\/(?!view-product)/)) {
                request.respond({
                    contentType: 'application/json',
                    body: JSON.stringify(testData)
                })
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl + '/vn/sales/' + sales[0].slug)
        await page.click('.product-card')

        expect(await page.$('.product-content')).not.toBeNull()
    })
})