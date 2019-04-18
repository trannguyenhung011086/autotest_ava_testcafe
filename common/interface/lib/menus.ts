import * as Model from "../lib/sales";

export type Breadcrumb = {
    id: string;
    index: number;
    displayName: {
        en: string;
        vn: string;
    };
    slug: {
        en: string;
        vn: string;
    };
};

export type Meta = {
    description: string;
    title: string;
};

export interface Menus {
    id: string;
    displayName: {
        en: string;
        vn: string;
    };
    slug: {
        en: string;
        vn: string;
    };
    categories: string[];
    breadcrumbs: Breadcrumb[];
    meta: Meta;
    parentId?: string;
}

export interface MenuProducts {
    data: Model.Products[];
    total: number;
}
