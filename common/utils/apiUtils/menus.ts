import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";

export class MenusUtils extends Helper {
    constructor() {
        super();
    }

    public async getAllMenus(): Promise<Model.Menus[]> {
        const res = await this.get(config.api.menus);

        if (res.statusCode != 200) {
            throw {
                message: "Cannot get all menus!",
                error: JSON.stringify(res.body, null, "\t")
            };
        }

        return res.body;
    }

    public async getMenus(typeMenu: string) {
        const menus = await this.getAllMenus();

        let topMenus: Model.Menus[] = [];
        let subMenus: Model.Menus[] = [];

        menus.forEach(menu => {
            if (!menu.parentId) {
                topMenus.push(menu);
            } else {
                subMenus.push(menu);
            }
        });

        if (typeMenu == "top") {
            return topMenus;
        } else {
            return subMenus;
        }
    }

    public async getSalesByMenu(menu: string): Promise<Model.SalesModel[]> {
        const res = await this.get(config.api.menuSales + menu);

        if (res.statusCode != 200) {
            throw {
                message: "Cannot get sales by menu " + menu,
                error: JSON.stringify(res.body, null, "\t")
            };
        }

        return res.body;
    }

    public async getProductsByMenu(menu: string): Promise<Model.MenuProducts> {
        const res = await this.get(config.api.menuProducts + menu);

        if (res.statusCode != 200) {
            throw {
                message: "Cannot get products by menu " + menu,
                error: JSON.stringify(res.body, null, "\t")
            };
        }

        return res.body;
    }

    public async getProductVariationsByMenu(
        menu: string
    ): Promise<Model.MenuProducts> {
        const res = await this.get(config.api.menuProductVariations + menu);

        if (res.statusCode != 200) {
            throw {
                message: "Cannot get product variations by menu " + menu,
                error: JSON.stringify(res.body, null, "\t")
            };
        }

        return res.body;
    }
}
