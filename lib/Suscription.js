"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicSubscription = void 0;
const voice_1 = require("@discordjs/voice");
function wait(time) {
    return new Promise((resolve) => setTimeout(resolve, time).unref());
}
class MusicSubscription {
    constructor(voiceConnection, { onStart, onAddQueue, onFinish, onDestroy, onError }) {
        this.queueLock = false;
        this.readyLock = false;
        this.voiceConnection = voiceConnection;
        this.audioPlayer = voice_1.createAudioPlayer();
        this.queue = [];
        this.onStart = onStart;
        this.onAddQueue = onAddQueue;
        this.onFinish = onFinish;
        this.onDestroy = onDestroy;
        this.onError = onError;
        this.voiceConnection.on(voice_1.VoiceConnectionStatus.Disconnected, async (_, newState) => {
            if (newState.reason === voice_1.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014)
                try {
                    await voice_1.entersState(this.voiceConnection, voice_1.VoiceConnectionStatus.Connecting, 5000);
                }
                catch {
                    this.voiceConnection.destroy();
                }
            else if (this.voiceConnection.rejoinAttempts < 5) {
                await wait((this.voiceConnection.rejoinAttempts + 1) * 5000);
                this.voiceConnection.rejoin();
            }
            else
                this.voiceConnection.destroy();
        });
        this.voiceConnection.on(voice_1.VoiceConnectionStatus.Destroyed, async () => {
            this.stop();
            this.onDestroy();
        });
        this.voiceConnection.on(voice_1.VoiceConnectionStatus.Signalling || voice_1.VoiceConnectionStatus.Connecting, async () => {
            if (!this.readyLock) {
                this.readyLock = true;
                try {
                    await voice_1.entersState(this.voiceConnection, voice_1.VoiceConnectionStatus.Ready, 20000);
                }
                catch {
                    if (this.voiceConnection.state.status !== voice_1.VoiceConnectionStatus.Destroyed)
                        this.voiceConnection.destroy();
                }
                finally {
                    this.readyLock = false;
                }
            }
        });
        this.audioPlayer.on('stateChange', async (oldState, newState) => {
            if (newState.status === voice_1.AudioPlayerStatus.Idle && oldState.status !== voice_1.AudioPlayerStatus.Idle)
                if (this.loop)
                    await this.processQueue(oldState.resource.metadata);
                else {
                    this.onFinish(this);
                    await this.processQueue();
                }
            else if (newState.status === voice_1.AudioPlayerStatus.Playing)
                this.onStart(newState.resource.metadata);
        });
        this.audioPlayer.on('error', (error) => this.onError(error));
        voiceConnection.subscribe(this.audioPlayer);
    }
    addedToQueue(song) {
        this.queue.push(song);
        void this.processQueue(song);
    }
    setLoop(loop) {
        this.loop = loop;
    }
    removeQueue(song) {
        if (song) {
            const cancion = this.queue.findIndex((_, i) => i == song);
            if (cancion > -1)
                this.queue.splice(cancion, 1);
        }
        else
            this.queue = [];
    }
    stop() {
        this.queueLock = true;
        this.removeQueue();
        this.audioPlayer.stop(true);
        this.queueLock = false;
    }
    async processQueue(song) {
        if (this.queueLock || (this.queue.length == 0 && !this.loop && !song))
            return;
        if (this.audioPlayer.state.status !== voice_1.AudioPlayerStatus.Idle)
            return this.onAddQueue(song);
        this.queueLock = true;
        let nextSong;
        if (this.loop == 'single' && song)
            nextSong = song;
        else if (this.loop == 'all') {
            const index = this.queue.findIndex((sg) => sg.id == song.id);
            if (index < 0) {
                nextSong = this.queue[0];
                this.queue.push(song);
            }
            else if (index + 1 == this.queue.length)
                nextSong = this.queue[0];
            else
                nextSong = this.queue[index + 1];
        }
        else
            nextSong = this.queue.shift();
        try {
            const resource = await nextSong.createAudioResource();
            this.audioPlayer.play(resource);
            this.queueLock = false;
        }
        catch (error) {
            this.onError(error);
            this.queueLock = false;
            return this.processQueue();
        }
    }
}
exports.MusicSubscription = MusicSubscription;
