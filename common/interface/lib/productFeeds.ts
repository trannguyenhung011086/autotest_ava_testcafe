// https://developers.facebook.com/docs/marketing-api/reference/product-item
export interface FacebookFeeds {
    availability: string;
    brand: string;
    condition: string;
    description: string;
    id: string;
    image_link: string;
    link: string;
    price: string;
    sale_price: string;
    sale_price_effective_date: string;
    title: string;
    google_product_category: string;
}

export interface GoogleFeeds {
    "Page URL": string;
    "Custom label": string;
}

export interface GoogleDynamicFeeds {
    "Final URL": string;
    "Final mobile URL": string;
    ID: string;
    "Image URL": string;
    "Item category": string;
    "Item description": string;
    "Item title": string;
    Price: string;
    "Sale price": string;
}

// https://support.criteo.com/hc/en-us/articles/207571095-Criteo-Product-Feed-specification

export interface CriteoFeeds {
    id: string;
    producturl: string;
    bigimage: string;
    name: string;
    price: string;
    retailprice: string;
    description: string;
    instock: string;
    extra_brand: string;
    extra_color: string;
    extra_size: string;
    category: string;
}
export interface CriteoFeeds2 {
    id: string;
    link: string;
    image_link: string;
    title: string;
    price: string;
    sale_price: string;
    description: string;
    availability: string;
    google_product_category: string;
    color: string;
    size: string;
    brand: string;
    product_type: string;
    adult: string;
    condition: string;
    age_group: string;
}

// https://support.google.com/merchants/answer/7052112?visit_id=636843313735285289-2875708423&hl=en&rd=1
export interface GoogleMerchantFeeds {
    _declaration: {
        _attributes: {
            version: string;
            encoding: string;
        };
    };
    feed: {
        _attributes: {
            xmlns: string;
            "xmlns:g": string;
        };
        entry: Entry[];
    };
}

export type Text = {
    _text: string;
};

export type Entry = {
    "g:id": Text;
    "g:title": Text;
    "g:description": Text;
    "g:link": Text;
    "g:image_link": Text;
    "g:availability": Text;
    "g:price": Text;
    "g:sale_price": Text;
    "g:brand": Text;
    "g:gtin": Text;
    "g:condition": Text;
    "g:google_product_category": Text;
    "g:product_type": Text;
    "g:mpn": Text;
    "g:adult": Text;
    "g:multipack": Text;
    "g:is_bundle": Text;
    "g:age_group": Text;
    "g:color": Text;
    "g:gender": Text;
    "g:material": Text;
    "g:pattern": Text;
    "g:size": Text;
    "g:item_group_id": Text;
    "g:shipping": Text;
    "g:tax": Text;
};

export interface InsiderFeeds {
    _declaration: {
        _attributes: {
            version: string;
            encoding: string;
        };
    };
    products: {
        _attributes: {
            xmlns: string;
        };
        product: ProductEntry[];
    };
}

export type ProductEntry = {
    id: Text;
    title: Text;
    link: Text;
    image_url: Text;
    description: Text;
    category: Text;
    price: Text;
    sale_price: Text;
    instock: Text;
    extra_brand: Text;
};

export interface RtbHouseFeeds {
    id: string;
    name: string;
    producturl: string;
    bigimage: string;
    price: string;
    retailprice: string;
    description: string;
    instock: string;
    extra_brand: string;
    extra_color: string;
    extra_size: string;
    category: string;
}
