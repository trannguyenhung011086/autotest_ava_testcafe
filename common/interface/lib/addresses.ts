export interface Shipping {
	address: string;
	city: City;
	district: District;
	firstName: string;
	lastName: string;
	id?: string;
	phone: string;
	default: boolean;
	[key: string]: any;
}

export interface Billing extends Shipping {
	companyName: string;
	taxCode: string;
}

export type City = {
	id: string;
	name: string;
};

export type District = {
	id: string;
	name: string;
};

export interface Addresses {
	billing: Billing[];
	shipping: Shipping[];
}
