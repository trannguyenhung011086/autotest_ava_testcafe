import { Browser } from '../common'
import Header from './header'
import Login from './login'
import ProductList from './productList'
import Popup from './popup'

export {
    Header,
    Login,
    ProductList,
    Popup
}

export class AllPages {
    public header: Header
    public login: Login
    public productList: ProductList
    public popup: Popup
    constructor(browser: Browser) {
        this.header = new Header(browser)
        this.login = new Login(browser)
        this.productList = new ProductList(browser)
        this.popup = new Popup(browser)
    }
}