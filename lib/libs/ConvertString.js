"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertString = void 0;
const ConvertString = (dinero) => String(dinero).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
exports.ConvertString = ConvertString;
