"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Song = void 0;
const voice_1 = require("@discordjs/voice");
const youtube_dl_exec_1 = require("youtube-dl-exec");
class Song {
    constructor(SongData) {
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
    createAudioResource() {
        return new Promise((resolve, reject) => {
            const process = youtube_dl_exec_1.raw(this.url, {
                o: '-',
                q: '',
                f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                r: '100K'
            }, { stdio: ['ignore', 'pipe', 'ignore'] });
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            const onError = (error) => {
                if (!process.killed)
                    process.kill();
                stream.resume();
                reject(error);
            };
            process
                .once('spawn', () => {
                voice_1.demuxProbe(stream)
                    .then((probe) => resolve(voice_1.createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
                    .catch(onError);
            })
                .catch(onError);
        });
    }
}
exports.Song = Song;
