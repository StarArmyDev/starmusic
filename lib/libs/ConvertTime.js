"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertTime = void 0;
const ConvertTime = (time) => {
    const hrs = ~~(time / 3600);
    const mins = ~~((time % 3600) / 60);
    const secs = ~~time % 60;
    let ret = '';
    if (hrs > 0)
        ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
    ret += '' + mins + ':' + (secs < 10 ? '0' : '');
    ret += '' + secs;
    return ret;
};
exports.ConvertTime = ConvertTime;
