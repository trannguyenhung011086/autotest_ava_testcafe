import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";

export class AccountUtils extends Helper {
	constructor() {
		super();
	}

	public async getAccountInfo(cookie?: string): Promise<Model.Account> {
		const res = await this.get(config.api.account, cookie);
		if (res.statusCode != 200) {
			throw {
				message: "Cannot get account info!",
				error: JSON.stringify(res.body, null, "\t")
			};
		}
		return res.body;
	}
}
