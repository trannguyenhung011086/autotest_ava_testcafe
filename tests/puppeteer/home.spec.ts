import config from '../../config/config'
import Puppeteer from 'puppeteer'
let browser: Puppeteer.Browser
let page: Puppeteer.Page


describe('Intercept requests at home page - API return error ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        })
        page = await browser.newPage()
    })

    afterAll(async () => {
        await browser.close()
    })

    test('API return error', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url().match(/\/api\/v2/)) {
                request.abort()
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl)

        await page.$$eval('.load-for-sales', els => els[0].scrollIntoView())
        expect(await page.$('.shop-today-new-sales')).toBeNull()

        await page.$$eval('.load-for-sales', els => els[1].scrollIntoView())
        expect(await page.$('.potd-sales')).toBeNull()

        await page.$$eval('.load-for-sales', els => els[2].scrollIntoView())
        expect(await page.$('.still-on-sales')).toBeNull()

        await page.$$eval('.load-for-sales', els => els[3].scrollIntoView())
        expect(await page.$('.upcoming-sale')).toBeNull()

        await page.$eval('.card-of-best-sellers', el => el.scrollIntoView())
        expect(await page.$('.today-best-sellers')).toBeNull()
    })
})

describe('Intercept requests at home page - API return empty ' + config.baseUrl, () => {
    beforeAll(async () => {
        browser = await Puppeteer.launch({
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        })
        page = await browser.newPage()
    })

    afterAll(async () => {
        await browser.close()
    })

    test('API return empty', async () => {
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.url().match(/\/api\/v2/)) {
                request.respond({
                    body: JSON.stringify([])
                })
            } else {
                request.continue()
            }
        })

        await page.goto(config.baseUrl)
        await page.$eval('#footer', el => el.scrollIntoView())

        expect(await page.$('.shop-today-new-sales')).toBeNull()
        expect(await page.$('.potd-sales')).toBeNull()
        expect(await page.$('.today-best-sellers')).toBeNull()
        expect(await page.$('.still-on-sales')).toBeNull()
        expect(await page.$('.upcoming-sale')).toBeNull()
    })
})