export interface embedJSON {
    title?: string;
    type: 'rich';
    description?: string;
    url?: string;
    timestamp?: Date;
    color: number;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    thumbnail?: {
        url: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    video?: {
        url: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    image?: {
        url: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
        proxy_icon_url?: string;
    };
    footer?: {
        text: string;
        icon_url?: string;
        proxy_icon_url?: string;
    };
}
