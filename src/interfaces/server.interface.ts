import { ICancion } from '.';

/** Interfaz para las opciones del servidor */
export interface ServerOpts {
    songs: ICancion[];
    last?: ICancion;
    loop?: 'single' | 'all';
    volume: number;
    isRadio: boolean;
}
