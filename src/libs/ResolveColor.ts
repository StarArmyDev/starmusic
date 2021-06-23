/**
 * Resuelve un ColorResolvable en un número de color.
 * @param color Color a resolver
 * @returns Un color
 */
export const resolveColor = (color: Colors | Colors[]): number => {
    if (!(color instanceof Array)) {
        if (color === Colors.RANDOM) return Math.floor(Math.random() * (0xffffff + 1));
        if (color === Colors.DEFAULT) return 0;
    } else if (Array.isArray(color)) color = (color[0] << 16) + (color[1] << 8) + color[2];

    if (color < 0 || color > 0xffffff) throw new RangeError('COLOR_RANGE');
    else if (color && isNaN(Number(color))) throw new TypeError('COLOR_CONVERT');

    return Number(color);
};

export enum Colors {
    RANDOM = 1,
    DEFAULT = 0x000000,
    WHITE = 0xffffff,
    AQUA = 0x1abc9c,
    GREEN = 0x2ecc71,
    BLUE = 0x3498db,
    YELLOW = 0xffff00,
    PURPLE = 0x9b59b6,
    LUMINOUS_VIVID_PINK = 0xe91e63,
    GOLD = 0xf1c40f,
    ORANGE = 0xe67e22,
    RED = 0xe74c3c,
    GREY = 0x95a5a6,
    NAVY = 0x34495e,
    DARK_AQUA = 0x11806a,
    DARK_GREEN = 0x1f8b4c,
    DARK_BLUE = 0x206694,
    DARK_PURPLE = 0x71368a,
    DARK_VIVID_PINK = 0xad1457,
    DARK_GOLD = 0xc27c0e,
    DARK_ORANGE = 0xa84300,
    DARK_RED = 0x992d22,
    DARK_GREY = 0x979c9f,
    DARKER_GREY = 0x7f8c8d,
    LIGHT_GREY = 0xbcc0c0,
    DARK_NAVY = 0x2c3e50,
    BLURPLE = 0x7289da,
    GREYPLE = 0x99aab5,
    DARK_BUT_NOT_BLACK = 0x2c2f33,
    NOT_QUITE_BLACK = 0x23272a
}

export type ColorsFlags =
    | 'RANDOM'
    | 'DEFAULT'
    | 'WHITE'
    | 'AQUA'
    | 'GREEN'
    | 'BLUE'
    | 'YELLOW'
    | 'PURPLE'
    | 'LUMINOUS_VIVID_PINK'
    | 'GOLD'
    | 'ORANGE'
    | 'RED'
    | 'GREY'
    | 'NAVY'
    | 'DARK_AQUA'
    | 'DARK_GREEN'
    | 'DARK_BLUE'
    | 'DARK_PURPLE'
    | 'DARK_VIVID_PINK'
    | 'DARK_GOLD'
    | 'DARK_ORANGE'
    | 'DARK_RED'
    | 'DARK_GREY'
    | 'DARKER_GREY'
    | 'LIGHT_GREY'
    | 'DARK_NAVY'
    | 'BLURPLE'
    | 'GREYPLE'
    | 'DARK_BUT_NOT_BLACK'
    | 'NOT_QUITE_BLACK';
