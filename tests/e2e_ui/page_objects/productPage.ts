import { Selector, t } from "testcafe";
import { BasePage } from "./basePage";

export class ProductPage extends BasePage {
    leadTime: Selector;

    constructor() {
        super();
        this.leadTime = Selector(".date-delivery");
    }

    public async getLeadTime() {
        return (await this.leadTime.textContent).trim();
    }
}
