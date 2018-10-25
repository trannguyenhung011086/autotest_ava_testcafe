import { Builder, ThenableWebDriver, By, until, WebElement, IWebDriverCookie } from 'selenium-webdriver'
import config from '../config/config'
import { Options as ChromeOptions } from 'selenium-webdriver/chrome'
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox'

export class Browser {

    private driver: ThenableWebDriver;
    public constructor(private browserName: string, private device: string = 'desktop') {
        let chromeOptions = new ChromeOptions()
        // chromeOptions.headless()
        let firefoxOptions = new FirefoxOptions()
        // firefoxOptions.headless()

        if (device == 'desktop') {
            this.driver = new Builder()
                .withCapabilities({ "browserName": browserName, "enableVNC": false })
                .setChromeOptions(chromeOptions)
                .setFirefoxOptions(firefoxOptions)
                // .usingServer(config.remote)
                .build()
        } else {
            this.driver = new Builder()
                .withCapabilities({ "browserName": browserName, "enableVNC": false })
                .setChromeOptions(chromeOptions.setMobileEmulation({ deviceName: device }))
                // .usingServer(config.remote)
                .build()
        }
    }

    public async navigate(url: string) {
        await this.driver.get(url)
    }

    public async close() {
        await this.driver.quit()
    }

    public async wait(time: number) {
        await this.driver.sleep(time)
    }

    public async findElement(selector: string) {
        var el: WebElement = await this.driver.wait(until.elementLocated(By.css(selector)), 10000)
            .catch(e => {
                throw { msg: 'cannot find ' + selector, error: e }
            })
        return el
    }

    public async findElements(selector: string) {
        var els: WebElement[] = await this.driver.wait(until.elementsLocated(By.css(selector)), 10000)
            .catch(e => {
                throw { msg: 'cannot find ' + selector, error: e }
            })
        return els
    }

    public async isVisible(selector: string) {
        try {
            await this.findElement(selector)
            return true
        } catch (e) {
            return false
        }
    }

    public async getText(selector: string) {
        var el = await this.findElement(selector)
        return await el.getText()
            .catch(e => {
                throw { msg: 'cannot get text from ' + selector, error: e }
            })
    }

    public async getAttribute(selector: string, attribute: string) {
        var el = await this.findElement(selector)
        return await el.getAttribute(attribute)
            .catch(e => {
                throw { msg: 'cannot get attribute value from ' + selector, error: e }
            })
    }

    public async scrollTo(selector: string) {
        var el = await this.findElement(selector)
        await this.driver.executeScript("arguments[0].scrollIntoView(true);", el)
        await this.driver.wait(until.elementIsVisible(el), 1000)
    }

    public async click(selector: string) {
        var el = await this.findElement(selector)
        await el.click()
            .catch(e => {
                throw { msg: 'cannot click ' + selector, error: e }
            })
    }

    public async scrollClick(selector: string) {
        await this.scrollTo(selector)
        await this.click(selector)
    }

    public async type(selector: string, content: string) {
        var el = await this.findElement(selector)
        await el.clear()
            .catch(e => {
                throw { msg: 'cannot clear ' + selector, error: e }
            })
        await el.sendKeys(content)
            .catch(e => {
                throw { msg: 'cannot type at ' + selector, error: e }
            })
    }

    public async convertCookie(cookie: string) {
        var result: Object = cookie.split('; ').reduce((result, value) => {
            result[value.split('=')[0]] = value.split('=')[1]
            return result
        }, {})
        return result
    }

    public async setCokie(cookies: string[]) {
        cookies.forEach(async (cookie) => {
            var cookieToSet = await this.convertCookie(cookie)
            var data: IWebDriverCookie = {
                name: Object.keys(cookieToSet)[0],
                value: cookieToSet[Object.keys(cookieToSet)[0]],
                domain: cookieToSet['Domain'],
                path: cookieToSet['Path'],
                expiry: new Date(cookieToSet['Expires']).getTime(),
                httpOnly: true,
                secure: true
            }
            await this.driver.manage().addCookie(data)
        })
        await this.driver.navigate().refresh()
    }
}