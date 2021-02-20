/**
 * Convierte un valor de tiempo en un string de hora.
 * @param {number} time Tiempo en milisegundos.
 * @returns {string} Un string de hora estilo hr:min:seg
 */
export const ConvertTime = (time: number): string => {
    const hrs = ~~(time / 3600);
    const mins = ~~((time % 3600) / 60);
    const secs = ~~time % 60;
    let ret = '';
    if (hrs > 0) ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
    ret += '' + mins + ':' + (secs < 10 ? '0' : '');
    ret += '' + secs;
    return ret;
};
