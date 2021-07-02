import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
    createAudioPlayer,
    entersState
} from '@discordjs/voice';
import { Song } from './Song';

function wait(time: number): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve, time).unref());
}

/**
 * Este archivo está basado en el código de ejemplo proporcionado por el staff de
 * Discord.js en GitHub.
 *
 * @see https://github.com/discordjs/voice/tree/main/examples/music-bot/src/music/subscription.ts
 */

interface functionsData {
    onStart: (song: Song) => void;
    onAddQueue: (song: Song) => void;
    onFinish: (subscription: MusicSubscription) => void;
    onDestroy: () => void;
    onError: (error: unknown) => void;
}

/**
 * Por cada conexión de audio exite un MusicSubscription con la cola de reprodución y ajustes de la misma.
 */
export class MusicSubscription {
    public readonly voiceConnection: VoiceConnection;
    public readonly audioPlayer: AudioPlayer;
    public queue: Song[];
    public queueLock = false;
    public readyLock = false;
    public loop?: 'single' | 'all';
    public readonly onStart: (song: Song) => void;
    public readonly onAddQueue: (song: Song) => void;
    public readonly onFinish: (subscription: MusicSubscription) => void;
    public readonly onDestroy: () => void;
    public readonly onError: (error: unknown) => void;

    public constructor(voiceConnection: VoiceConnection, { onStart, onAddQueue, onFinish, onDestroy, onError }: functionsData) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];
        this.onStart = onStart;
        this.onAddQueue = onAddQueue;
        this.onFinish = onFinish;
        this.onDestroy = onDestroy;
        this.onError = onError;

        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async (_, newState) => {
            if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014)
                try {
                    // Probablemente se movió el canal de voz
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                } catch {
                    // Probablemente eliminado del canal de voz
                    this.voiceConnection.destroy();
                }
            else if (this.voiceConnection.rejoinAttempts < 5) {
                /*
						La desconexión en este caso es recuperable, y también tenemos < 5 intentos repetidos por lo que nos volveremos a conectar.
					*/
                await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
                this.voiceConnection.rejoin();
                /*
						La desconexión en este caso puede ser recuperable, pero no nos quedan más intentos: destruir.
					*/
            } else this.voiceConnection.destroy();
        });

        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, async () => {
            this.stop();
            this.onDestroy();
        });

        this.voiceConnection.on(VoiceConnectionStatus.Signalling || VoiceConnectionStatus.Connecting, async () => {
            if (!this.readyLock) {
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.audioPlayer.on('stateChange', async (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle)
                if (this.loop) await this.processQueue((oldState.resource as AudioResource<Song>).metadata);
                else {
                    this.onFinish(this);
                    await this.processQueue();
                }
            else if (newState.status === AudioPlayerStatus.Playing) this.onStart((newState.resource as AudioResource<Song>).metadata);
        });

        this.audioPlayer.on('error', (error) => this.onError(error));

        voiceConnection.subscribe(this.audioPlayer);
    }

    /**
     * Agrega una nueva canción a la cola.
     *
     * @param Song La canción para agregar a la cola
     */
    public addedToQueue(song: Song): void {
        this.queue.push(song);
        void this.processQueue(song);
    }

    /**
     * Establece el modo de reproducción de la cola actual.
     *
     * @param loop El valor a establecer
     */
    public setLoop(loop?: 'single' | 'all'): void {
        this.loop = loop;
    }

    /**
     * Vacía la cola de reproducción o remueve una canción de ella.
     *
     * @param song Número de la posición de la canción a remover.
     */
    public removeQueue(song?: number): void {
        if (song) {
            const cancion = this.queue.findIndex((_, i) => i == song);
            if (cancion > -1) this.queue.splice(cancion, 1);
        } else this.queue = [];
    }

    /**
     * Detiene la reproducción de audio y vacía la cola
     */
    public stop(): void {
        this.queueLock = true;
        this.removeQueue();
        this.audioPlayer.stop(true);
        this.queueLock = false;
    }

    /**
     * Reproduce una canción de la cola si es posible
     * @param song Una canción que es pasada desde addedToQueue.
     * @returns No retorna nada.
     */
    private async processQueue(song?: Song): Promise<void> {
        if (this.queueLock || (this.queue.length == 0 && !this.loop && !song)) return;
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle) return this.onAddQueue(song);

        this.queueLock = true;

        let nextSong;
        if (this.loop == 'single' && song) nextSong = song;
        else if (this.loop == 'all') {
            const index = this.queue.findIndex((sg) => sg.id == song.id)!;
            if (index < 0) {
                nextSong = this.queue[0];
                this.queue.push(song);
            } else if (index + 1 == this.queue.length) nextSong = this.queue[0];
            else nextSong = this.queue[index + 1];
        } else nextSong = this.queue.shift()!;

        try {
            const resource = await nextSong.createAudioResource();
            this.audioPlayer.play(resource);
            this.queueLock = false;
        } catch (error) {
            this.onError(error);
            this.queueLock = false;
            return this.processQueue();
        }
    }
}
