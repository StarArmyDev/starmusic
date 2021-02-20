/** Interfaz para una canción */
export interface ICancion {
    /**
     * ID del video de Youtube.
     */
    id: string;
    /**
     * ID del autor de Discord que solicitó la canción.
     */
    autorID: string;
    /**
     * Posicion de la canción en la cola.
     */
    position: number;
    /**
     * Título de la canción.
     */
    title: string;
    /**
     * URL de la canción.
     */
    url: string;
    /**
     * ID del canal que subió el video.
     */
    channelId: string;
    /**
     * Duración de la canción.
     */
    duration?: number | null;
    /**
     * Cantidad de me gusta.
     */
    likes?: number;
    /**
     * Cantidad de no me gusta.
     */
    dislikes?: number;
    /**
     * Cantidad de vistas.
     */
    views?: number;
    /**
     * Categoría del video.
     */
    category?: string;
    /**
     * Fecha de cuando se publicó.
     */
    datePublished?: Date;
}
