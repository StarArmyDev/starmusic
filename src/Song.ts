import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import { raw as ytdl } from 'youtube-dl-exec';

/**
 * Este archivo está basado en el código de ejemplo proporcionado por el staff de
 * Discord.js en GitHub.
 *
 * @see https://github.com/discordjs/voice/tree/main/examples/music-bot/src/music/track.ts
 */

/**
 * Representa una canción con su información de YouTube para ser agregada a la cola.
 *
 * La canción se mantiene en cola con la información ya precargada para cuando salga
 * de la cola, se convierta en un recurso de audio para ser reproducida.
 */
export class Song implements SongData {
    public readonly id: string;
    public readonly autorID: string;
    public readonly title: string;
    public readonly url: string;
    public readonly channelID: string;
    public readonly duration?: number | null;
    public readonly likes?: number;
    public readonly dislikes?: number;
    public readonly views?: number;
    public readonly category?: string;
    public readonly datePublished?: Date;

    constructor(SongData: SongData) {
        this.id = SongData.id;
        this.autorID = SongData.autorID;
        this.title = SongData.title;
        this.url = SongData.url;
        this.channelID = SongData.channelID;
        this.duration = SongData.duration;
        this.likes = SongData.likes;
        this.dislikes = SongData.dislikes;
        this.views = SongData.views;
        this.category = SongData.category;
        this.datePublished = SongData.datePublished;
    }

    /**
     * Crea un recurso de audio a partir de esta canción.
     */
    public createAudioResource(): Promise<AudioResource<Song>> {
        return new Promise((resolve, reject) => {
            const process = ytdl(
                this.url,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                    r: '100K'
                },
                { stdio: ['ignore', 'pipe', 'ignore'] }
            );
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            const onError = (error: unknown): void => {
                if (!process.killed) process.kill();
                stream.resume();
                reject(error);
            };
            process
                .once('spawn', () => {
                    demuxProbe(stream)
                        .then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
                        .catch(onError);
                })
                .catch(onError);
        });
    }
}

/** Interfaz para una canción */
export interface SongData {
    /**
     * ID del video de Youtube.
     */
    id: string;
    /**
     * ID del autor de Discord que solicitó la canción.
     */
    autorID: string;
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
    channelID: string;
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
