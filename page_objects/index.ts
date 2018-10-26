import { Browser } from '../common'
import Header from './header'
import Login from './login'
import ProductList from './productList'

export {
    Header,
    Login,
    ProductList
}

export class AllPages {
    public header: Header
    public login: Login
    public productList: ProductList
    constructor(browser: Browser) {
        this.header = new Header(browser)
        this.login = new Login(browser)
        this.productList = new ProductList(browser)
    }
}