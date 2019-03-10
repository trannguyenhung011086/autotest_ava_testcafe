import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";

export class CreditCardUtils extends Helper {
	constructor() {
		super();
	}

	public async getCards(cookie?: string): Promise<Model.CreditCard[]> {
		try {
			const res = await this.get(config.api.creditcard, cookie);
			return res.body;
		} catch (e) {
			throw {
				message: "Cannot get card list!",
				error: JSON.stringify(e, null, "\t")
			};
		}
	}

	public async getCard(provider: string, cookie?: string): Promise<string> {
		let creditCards = await this.getCards(cookie);
		let matchedCard: string;

		for (let card of creditCards) {
			if (provider == "PayDollar" && !card.provider) {
				matchedCard = card.id;
				break;
			}
			if (provider == "Stripe" && card.provider) {
				matchedCard = card.id;
				break;
			}
		}

		if (!matchedCard) {
			throw "No saved CC found for " + provider;
		}
		return matchedCard;
	}
}
