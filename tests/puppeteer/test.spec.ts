import config from '../../config/config'
import Puppeteer from 'puppeteer'
let browser: Puppeteer.Browser
let page: Puppeteer.Page


describe('Intercept requests at home page', () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 720 }
        })
        page = await browser.newPage()
    })

    afterAll(async () => {
        await browser.close()
    })

    // test('Intercept today sales - return 1 sale', async () => {
    //     await page.setRequestInterception(true)
    //     page.on('request', request => {
    //         if (request.url() == `${config.baseUrl}/api/v2/home/today`) {
    //             request.respond({
    //                 body: JSON.stringify([
    //                     {
    //                         categories: ["Home"],
    //                         endTime: "7 days",
    //                         id: "5c1365fca323112aaf22cf10",
    //                         image: "5c13930719de02fecddb9921.jpg",
    //                         image2: "5c139306567684c244ebf7c6.jpg",
    //                         image4: "5c139310a3231130b922d64a.jpg",
    //                         international: false,
    //                         potd: false,
    //                         slug: "fujihoro-visions-faber-5c1365fca323112aaf22cf10",
    //                         title: "Fujihoro, Visions, Faber"
    //                     }
    //                 ])
    //             })
    //         }
    //         else {
    //             request.continue()
    //         }
    //     })

    //     await page.goto(config.baseUrl)
    //     expect(await page.$$eval('.shop-today-new-sales > .row > .card-in-today-new-sale', els => els.length))
    //         .toEqual(1)
    // })

    test('Intercept today sales - error API', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url() == `${config.baseUrl}/api/v2/home/today`) {
                request.abort()
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl)

        await page.evaluate(() => window.scrollBy(0,window.innerHeight))
        await page.waitForSelector('.potd-sales')

        expect(await page.$('.shop-today-new-sales')).toBeNull()
        expect(await page.$('.potd-sales')).toBeNull()
    })
})