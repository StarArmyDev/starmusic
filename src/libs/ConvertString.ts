/**
 * Agrega una coma cada tres carácteres de un texto o número dado.
 * @param {string|number} dinero Un string o número que se quiera dividir.
 * @returns {string} El string con una coma cada tres carácteres.
 */
export const ConvertString = (dinero: string | number): string => String(dinero).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
