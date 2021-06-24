"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colors = exports.resolveColor = void 0;
const resolveColor = (color) => {
    if (!Array.isArray(color)) {
        if (color === Colors.RANDOM)
            return Math.floor(Math.random() * (0xffffff + 1));
        if (color === Colors.DEFAULT)
            return 0;
    }
    else
        color = (color[0] << 16) + (color[1] << 8) + color[2];
    if (color < 0 || color > 0xffffff)
        throw new RangeError('COLOR_RANGE');
    else if (color && isNaN(Number(color)))
        throw new TypeError('COLOR_CONVERT');
    return Number(color);
};
exports.resolveColor = resolveColor;
var Colors;
(function (Colors) {
    Colors[Colors["RANDOM"] = 1] = "RANDOM";
    Colors[Colors["DEFAULT"] = 0] = "DEFAULT";
    Colors[Colors["WHITE"] = 16777215] = "WHITE";
    Colors[Colors["AQUA"] = 1752220] = "AQUA";
    Colors[Colors["GREEN"] = 3066993] = "GREEN";
    Colors[Colors["BLUE"] = 3447003] = "BLUE";
    Colors[Colors["YELLOW"] = 16776960] = "YELLOW";
    Colors[Colors["PURPLE"] = 10181046] = "PURPLE";
    Colors[Colors["LUMINOUS_VIVID_PINK"] = 15277667] = "LUMINOUS_VIVID_PINK";
    Colors[Colors["GOLD"] = 15844367] = "GOLD";
    Colors[Colors["ORANGE"] = 15105570] = "ORANGE";
    Colors[Colors["RED"] = 15158332] = "RED";
    Colors[Colors["GREY"] = 9807270] = "GREY";
    Colors[Colors["NAVY"] = 3426654] = "NAVY";
    Colors[Colors["DARK_AQUA"] = 1146986] = "DARK_AQUA";
    Colors[Colors["DARK_GREEN"] = 2067276] = "DARK_GREEN";
    Colors[Colors["DARK_BLUE"] = 2123412] = "DARK_BLUE";
    Colors[Colors["DARK_PURPLE"] = 7419530] = "DARK_PURPLE";
    Colors[Colors["DARK_VIVID_PINK"] = 11342935] = "DARK_VIVID_PINK";
    Colors[Colors["DARK_GOLD"] = 12745742] = "DARK_GOLD";
    Colors[Colors["DARK_ORANGE"] = 11027200] = "DARK_ORANGE";
    Colors[Colors["DARK_RED"] = 10038562] = "DARK_RED";
    Colors[Colors["DARK_GREY"] = 9936031] = "DARK_GREY";
    Colors[Colors["DARKER_GREY"] = 8359053] = "DARKER_GREY";
    Colors[Colors["LIGHT_GREY"] = 12370112] = "LIGHT_GREY";
    Colors[Colors["DARK_NAVY"] = 2899536] = "DARK_NAVY";
    Colors[Colors["BLURPLE"] = 7506394] = "BLURPLE";
    Colors[Colors["GREYPLE"] = 10070709] = "GREYPLE";
    Colors[Colors["DARK_BUT_NOT_BLACK"] = 2895667] = "DARK_BUT_NOT_BLACK";
    Colors[Colors["NOT_QUITE_BLACK"] = 2303786] = "NOT_QUITE_BLACK";
})(Colors = exports.Colors || (exports.Colors = {}));
