import { Message } from 'discord.js';
import { MusicOpts } from './interfaces';

declare module 'starmusic' {
    export default class StarMusic {
        constructor(options: MusicOpts);
        public play(message: Message, search: string): void;
        public leave(message: Message): void;
    }
}
