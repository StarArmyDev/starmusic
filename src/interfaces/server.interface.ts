import { ICancion } from '.';

/** Interfaz para las opciones del servidor */
export interface ServerOpts {
    songs: ICancion[];
    last?: ICancion;
    loop?: 'single' | 'all';
    id: string;
    volume: number;
    isRadio: boolean;
}
