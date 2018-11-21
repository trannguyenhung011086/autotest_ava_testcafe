import { Browser } from '../common'
import Header from './header'
import Login from './login'
import ProductList from './productList'
import Popup from './popup'
import Brand from './brand'

export {
    Header,
    Login,
    ProductList,
    Popup,
    Brand
}

export class AllPages {
    public header: Header
    public login: Login
    public productList: ProductList
    public popup: Popup
    public brand: Brand

    constructor(browser: Browser) {
        this.header = new Header(browser)
        this.login = new Login(browser)
        this.productList = new ProductList(browser)
        this.popup = new Popup(browser)
        this.brand = new Brand(browser)
    }
}