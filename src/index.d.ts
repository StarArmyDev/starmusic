import { Message } from 'discord.js';
import { MusicOpts } from './interfaces';

declare module 'starmusic' {
    export default class StarMusic {
        constructor(options: MusicOpts);

        /**
         * Reproduce una canción su nombre o la URL.
         * @param message Un mensaje de Discord.
         * @param search Canción a reproducir.
         */
        public play(message: Message, search: string): void;

        /**
         * Busca una lista de canciones para reproducir una de ellas.
         * @param message Un mensaje de Discord.
         * @param search Nombre de canciones a buscar.
         */
        public search(message: Message, search: string): void;

        /**
         * Inicia la radio.
         * @param message Un mensaje de Discord.
         * @param stream URL de la estación de radio a escuchar.
         */
        // public radio(message: Message, stream?: string): void;

        /**
         * Coloca pausa a la reproducción actual del bot.
         * @param message Un mensaje de Discord.
         */
        public pause(message: Message): void;

        /**
         * Reanuda la reproducción previamente pausada.
         * @param message Un mensaje de Discord.
         */
        public resume(message: Message): void;

        /**
         * Salta la canción en reproducción por la que sigue en la lista.
         * @param message Un mensaje de Discord.
         */
        public skip(message: Message): void;

        /**
         * Ve lo que se está reproduciendo actualmente
         * @param message Un mensaje de Discord.
         */
        public np(message: Message): void;

        /**
         * Establece el modo de repetición de la lista de canciones o canción actual.
         * @param message Un mensaje de Discord.
         * @param song Modo. Si no pasa esta propiedad el modo se establecerá al siguiente de la lista.
         * Modos:
         * * 1: Modo repetir una canción.
         * * 2: Repetir todas las canciones.
         * * 0 | 3: Desactivar modo repetir.
         */
        public repeat(message: Message, song?: 0 | 1 | 2 | 3): Promise<void>;

        /**
         * Ve la cola de reproducción actual.
         * @param message Un mensaje de Discord.
         * @param song Número de la canción en cola.
         */
        public queue(message: Message, song?: number): void;

        /**
         * Quita una canción de la cola de producción.
         * @param message Un mensaje de Discord.
         * @param song Número de la posisión de la canción a quitar
         */
        public remove(message: Message, song: number): void;

        /**
         * Saca al bot del canal de voz actual.
         * @param message Un mensaje de Discord.
         */
        public leave(message: Message): void;

        /**
         * Establece el volumen del bot.
         * @param message Un mensaje de Discord.
         * @param volume El nivel del volumen a establecer.
         */
        public volume(message: Message, volume: number): void;

        /**
         * Limpia la cola actual de reproducción.
         * @param message Un mensaje de Discord.
         */
        public clear(message: Message): void;
    }
}
