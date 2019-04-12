export interface Sitemap {
    _declaration: {
        _attributes: {
            version: string;
            encoding: string;
        };
    };
    urlset: {
        _attributes: {
            xmlns: string;
            "xmlns:image": string;
            "xmlns:mobile": string;
            "xmlns:news": string;
            "xmlns:video": string;
            "xmlns:xhtml": string;
        };
        url: Item[];
    };
}

export type Item = {
    loc: {
        _text: string;
    };
    lastmod: {
        _text: string;
    };
    changefreq: {
        _text: string;
    };
    priority: {
        _text: string;
    };
};
