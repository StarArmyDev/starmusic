import { ColorsType } from '../libs';

/** Interfaz para las opciones del módulo */
export interface MusicOpts {
    /**
     * Clave de la API de Youtube
     * Para obtener detalles sobre cómo obtener una clave de API y crear un proyecto, visite [este enlace](https://developers.google.com/youtube/v3/getting-started)
     */
    youtubeKey: string;
    /**
     * Color principal de los embeds.
     */
    embedColor?: ColorsType;
    /**
     * Link de la estación por defecto para la radio.
     */
    radioStation?: string;
    /**
     * Volumen por defecto del bot.
     */
    volumeDefault?: number;
    /**
     * Cola máxima que manejará el bot.
     */
    maxTail?: number;
    /**
     * Tasa de bits a manejar.
     */
    bitrate?: number | 'auto';
    /**
     * Emoji que se usará en el embed de reproducción.
     */
    emoji?: string;
    /**
     * IDs de roles que se consideran como admins en el servidor.
     */
    adminRoles?: string[];
    /**
     * IDs de roles que se consideran como DJ en el servidor.
     */
    djRoles?: string[];
    /**
     * Si solamente podrán poner música los que tengan el/los roles de DJ.
     */
    justDj?: boolean;
    /**
     * Si cualquiera puede sacarl al bot de un canal.
     */
    anyTakeOut?: boolean;
    /**
     * Si cualquiera puede pausar el bot en el servidor.
     */
    anyPause?: boolean;
    /**
     * Si cualquiera puede saltar una canción del bot en el servidor.
     */
    anySkip?: boolean;
    /**
     * Si se mandará un mensaje cada vez que comience una nueva canción.
     */
    newSongMessage?: boolean;
    /**
     * Si se mostrará el nombre del que use los comandos.
     */
    showName?: boolean;
}
