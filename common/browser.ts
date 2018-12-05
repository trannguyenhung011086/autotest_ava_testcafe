import { Builder, ThenableWebDriver, By, until, Key, WebElement, IWebDriverCookie } from 'selenium-webdriver'
import config from '../config/config'
import { Options as ChromeOptions } from 'selenium-webdriver/chrome'
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox'

export class Browser {

    private driver: ThenableWebDriver;
    public constructor(private browserName: string, private device: string = 'desktop') {
        let chromeOptions = new ChromeOptions()
        chromeOptions.addArguments("--window-size=1280,720")
        // chromeOptions.headless()
        let firefoxOptions = new FirefoxOptions()
        firefoxOptions.addArguments("--window-size=1280,720")
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

    public async waitForVisible(selector: string, timeout: number = 5000) {
        var els = await this.findElements(selector)
        await this.driver.wait(until.elementIsVisible(els[0]), timeout)
    }

    public async findElement(selector: string, timeout: number = 15000) {
        await this.driver.wait(until.elementLocated(By.css(selector)), timeout)
            .catch(e => {
                throw { msg: 'cannot locate element: ' + selector, error: e }
            })
        return await this.driver.findElement(By.css(selector))
            .catch(e => {
                throw { msg: 'cannot find element: ' + selector, error: e }
            })
    }

    public async findElements(selector: string, timeout: number = 15000) {
        await this.driver.wait(until.elementsLocated(By.css(selector)), timeout)
            .catch(e => {
                throw { msg: 'cannot locate elements: ' + selector, error: e }
            })
        return await this.driver.findElements(By.css(selector))
            .catch(e => {
                throw { msg: 'cannot find elements: ' + selector, error: e }
            })
    }

    public async isVisible(selector: string) {
        var el = await this.findElement(selector)
        return el.isDisplayed()
    }

    public async getText(selector: string) {
        var el = await this.findElement(selector)
        await this.driver.wait(until.elementTextMatches(el, /\w+/))
        return await el.getText()
            .catch(e => {
                throw { msg: 'cannot get text from ' + selector, error: e }
            })
    }

    public async getAttribute(selector: string, attribute: string) {
        var el = await this.findElement(selector)
        return await el.getAttribute(attribute)
            .catch(e => {
                throw {
                    msg: 'cannot get value from attribute ' + attribute + ' of element ' + selector,
                    error: e
                }
            })
    }

    public async scrollTo(selector: string) {
        var el = await this.findElement(selector)
        await this.driver.executeScript("arguments[0].scrollIntoView(true)", el)
        el = await this.findElement(selector)
        await this.driver.wait(until.elementIsVisible(el), 1000)
        return el
    }

    public async hover(selector: string) {
        var el = await this.scrollTo(selector)
        var strJavaScript = "var mouseEventObj = document.createEvent('MouseEvents'); mouseEventObj.initEvent( 'mouseover', true, true ); arguments[0].dispatchEvent(mouseEventObj);"
        await this.driver.executeScript(strJavaScript, el)
    }

    public async click(selector: string) {
        var el = await this.findElement(selector)
        try {
            await el.click()
        } catch (clickError) {
            // throw { msg: 'cannot click ' + selector, error: clickError }
            try {
                await this.driver.executeScript('arguments[0].click()', el)
            } catch (jsError) {
                throw { msg: 'cannot click ' + selector, error: jsError }
            }
        }
    }

    public async scrollClick(selector: string) {
        await this.scrollTo(selector)
        await this.click(selector)
    }

    public async type(selector: string, content: string) {
        var el = await this.findElement(selector)
        await el.clear()
        
        const text = await this.getAttribute(selector, 'value')
        if (text.length > 0) {
            await el.sendKeys(Key.HOME,Key.chord(Key.SHIFT,Key.END))
            await el.sendKeys(Key.DELETE)
        }

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

    public async addCookie(cookies: Array<any>) {
        cookies.forEach(async (cookie) => {
            var cookieToSet: Object
            var data: IWebDriverCookie
            if (typeof cookie == 'string') {
                cookieToSet = await this.convertCookie(cookie)
                data = {
                    name: Object.keys(cookieToSet)[0],
                    value: cookieToSet[Object.keys(cookieToSet)[0]],
                    domain: cookieToSet['Domain'],
                    path: cookieToSet['Path'],
                    expiry: new Date(cookieToSet['Expires']).getTime(),
                    httpOnly: true,
                    secure: true
                }
            } else if (typeof cookie == 'object') {
                data = cookie
            }
            await this.driver.manage().addCookie(data)
        })
        await this.driver.navigate().refresh()
    }

    public async getCookie(cookie: string) {
        return await this.driver.manage().getCookie(cookie)
    }
}