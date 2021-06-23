import { AudioPlayerStatus, AudioResource, VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { Colors, ColorsFlags, ConvertString, ConvertTime, resolveColor } from './libs';
import { GuildMember, Message, MessageEmbed, Snowflake } from 'discord.js';
import { MusicSubscription } from './Suscription';
import { ISongData, Song } from './Song';
import popyt from 'popyt';

export default abstract class Music {
    /**
     * Instancia de popyt para hacer búsquedas en YouTube.
     */
    protected _youtube: popyt;

    /**
     * Clave de la API de Youtube
     * Para obtener detalles sobre cómo obtener una clave de API y crear un proyecto, visite [este enlace](https://developers.google.com/youtube/v3/getting-started)
     */
    protected _youtubeKey: string;

    /**
     * Color principal de los embeds.
     */
    protected _embed_color: number;

    /**
     * Link de la estación por defecto para la radio.
     */
    protected _radio_station: string;

    /**
     * Cola máxima que manejará el bot.
     */
    protected _max_tail: number;

    /**
     * Tasa de bits a manejar.
     */
    protected _bitrate: number | 'auto';

    /**
     * Emoji que se usará en el embed de reproducción.
     */
    protected _emoji: string;

    /**
     * IDs de roles que se consideran como admins en el servidor.
     */
    protected _admin_roles: string[];

    /**
     * IDs de roles que se consideran como DJ en el servidor.
     */
    protected _dj_roles: string[];

    /**
     * Si solamente podrán poner música los que tengan el/los roles de DJ.
     */
    protected _just_dj: boolean;

    /**
     * Si cualquiera puede sacarl al bot de un canal.
     */
    protected _any_take_out: boolean;

    /**
     * Si cualquiera puede pausar el bot en el servidor.
     */
    protected _any_pause: boolean;

    /**
     * Si cualquiera puede saltar una canción del bot en el servidor.
     */
    protected _any_skip: boolean;

    /**
     * Si se mandará un mensaje cada vez que comience una nueva canción.
     */
    protected _new_song_message: boolean;

    /**
     * Si se mostrará el nombre del que use los comandos.
     */
    protected _show_name: boolean;

    protected _subscriptions = new Map<Snowflake, MusicSubscription>();

    /**
     * Crea una instancia de StarMusic.
     * @param {MusicOpts} options
     * @memberof Music
     */
    constructor(options: MusicOpts) {
        if (!options) throw new Error('No colocales ninguna propiedad, necesitas poner al menos a youtubeKey');
        if (!options.youtubeKey) throw new Error('No colocaste la propiedad youtubeKey');

        // Opciones y Configuraciones
        this._youtubeKey = options.youtubeKey;
        this._embed_color = resolveColor(Colors[options.embedColor] || Colors.RED);
        this._radio_station = options.radioStation || 'http://hd.digitalradio.mx:5883/;';
        this._max_tail = options.maxTail || 50;
        this._bitrate = options.bitrate || 'auto';
        this._emoji = options.emoji || '🔴';
        this._admin_roles = options.adminRoles || [''];
        this._dj_roles = options.djRoles || [''];
        this._just_dj = options.justDj || false;
        this._any_take_out = options.anyTakeOut || false;
        this._any_pause = options.anyPause || false;
        this._any_skip = options.anySkip || false;
        this._new_song_message = options.newSongMessage || true;
        this._show_name = options.showName || true;
        // Interno
        this._youtube = new popyt(this._youtubeKey);
    }

    // ? ================== ? //
    // ! Funciones Públicas ! //
    // ? ================== ? //

    /**
     * Reproduce una canción su nombre o la URL.
     * @param message Un mensaje de Discord.
     * @param search Canción a reproducir.
     */
    public abstract play(message: Message, search: string): void;

    /**
     * Busca una lista de canciones para reproducir una de ellas.
     * @param message Un mensaje de Discord.
     * @param search Nombre de canciones a buscar.
     */
    public abstract search(message: Message, search: string): void;

    /**
     * Inicia la radio.
     * @param message Un mensaje de Discord.
     * @param stream URL de la estación de radio a escuchar.
     */
    public abstract radio(message: Message, stream?: string): void;

    /**
     * Coloca pausa a la reproducción actual del bot.
     * @param message Un mensaje de Discord.
     */
    public abstract pause(message: Message): void;

    /**
     * Reanuda la reproducción previamente pausada.
     * @param message Un mensaje de Discord.
     */
    public abstract resume(message: Message): void;

    /**
     * Salta la canción en reproducción por la que sigue en la lista.
     * @param message Un mensaje de Discord.
     */
    public abstract skip(message: Message): void;

    /**
     * Saca al bot del canal de voz actual.
     * @param message Un mensaje de Discord.
     */
    public abstract leave(message: Message): void;

    /**
     * Ve lo que se está reproduciendo actualmente
     * @param message Un mensaje de Discord.
     */
    public abstract np(message: Message): void;

    /**
     * Establece el modo de repetición de la lista de canciones o canción actual.
     * @param message Un mensaje de Discord.
     * @param song Modo. Si no pasa esta propiedad el modo se establecerá al siguiente de la lista.
     * Modos:
     * * 1: Modo repetir una canción.
     * * 2: Repetir todas las canciones.
     * * 0 | 3: Desactivar modo repetir.
     */
    public abstract repeat(message: Message, song?: 0 | 1 | 2 | 3): Promise<void>;

    /**
     * Ve la cola de reproducción actual.
     * @param message Un mensaje de Discord.
     * @param song Número de la canción en cola.
     */
    public abstract queue(message: Message, song?: number): void;

    /**
     * Quita una canción de la cola de producción.
     * @param message Un mensaje de Discord.
     * @param song Número de la posisión de la canción a quitar
     */
    public abstract remove(message: Message, song: number): void;

    /**
     * Limpia la cola actual de reproducción.
     * @param message Un mensaje de Discord.
     */
    public abstract clear(message: Message): void;

    // ? ================== ? //
    // ! Funciones internas ! //
    // ? ================== ? //

    /**
     * Validar si el usuario es administrador.
     * @param member Un usuario de un servidor de Discord
     */
    protected isAdmin(member: GuildMember): boolean {
        if (member.id == member.guild.ownerID) return true;
        else if (member.roles.cache.find((r) => this._admin_roles.includes(r.id))) return true;
        else return member.permissions.has('ADMINISTRATOR');
    }

    /**
     * Validar si el usuario tiene rol de Dj.
     * @param member Un usuario de un servidor de Discord.
     */
    protected isDj(member: GuildMember): boolean {
        if (member.roles.cache.find((r) => this._dj_roles.includes(r.id))) return true;
        else return false;
    }

    /**
     *
     * @param n Cantidad de datos a retornar.
     */
    protected musicArraySort(array: Song[], n: number): Song[][] {
        return Array.from(Array(Math.ceil(array.length / n)), (_, i) => array.slice(i * n, i * n + n));
    }

    /**
     * Evalúa un string si es válido como url de transmición de audio.
     * @param url URL a evaluar.
     * @returns Si es válido el url.
     */
    protected isStreamValid(url: string): boolean {
        const pattern = /^((http|https):\/\/|www)[\w\d.-]+([a-z]{2,4})+(\/[\w\d.?%-=]+)?:\d+(\/\w*)?/gi;

        return pattern.test(url);
    }

    protected getSong(message: Message): Song {
        const subscription = this._subscriptions.get(message.guild.id);

        if (subscription?.audioPlayer && subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle)
            return (subscription.audioPlayer.state.resource as AudioResource<Song>).metadata;
    }

    /**
     * Conecta al bot en un canal de voz.
     * @param message Un mensaje de Discord
     */
    protected connectBot(message: Message): Promise<MusicSubscription> {
        let subscription = this._subscriptions.get(message.guild.id);

        return new Promise((resolve: (value: MusicSubscription) => void, reject) => {
            if (!subscription) {
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: true
                });

                subscription = new MusicSubscription(connection, {
                    onStart: (song: Song) => {
                        if (this._new_song_message) this.sendMessage(message, song);
                    },
                    onAddQueue: (song: Song) => {
                        this.sendMessageAddQueue(message, song);
                    },
                    onFinish: (sub: MusicSubscription) => {
                        if (sub.queue.length == 0) {
                            message.channel.send(this.notaMsg('note', 'Reproducción Terminada~'));
                            sub.stop();
                            sub.voiceConnection.disconnect();
                        }
                    },
                    onDestroy: () => {
                        this._subscriptions.delete(message.guild.id);
                    },
                    onError: (err) => {
                        throw `Error interno inesperado: ${err}`;
                    }
                });

                subscription.voiceConnection.on('error', console.warn);

                entersState(connection, VoiceConnectionStatus.Ready, 20_000)
                    .then(() => {
                        this._subscriptions.set(message.guild.id, subscription);
                        resolve(subscription);
                    })
                    .catch(() => {
                        connection.destroy();
                        message.reply(this.notaMsg('fail', 'No pude unirme al canal de voz. Vuelva a intentarlo más tarde.'));
                        reject();
                    });
            } else if (!message.member.voice.channel.joinable) {
                message.reply(this.notaMsg('fail', 'No tengo permiso para unirme a tu canal de voz'));
                reject();
            } else if (message.member.voice.channel.full) {
                message.reply(this.notaMsg('fail', 'El canal ya está lleno'));
                reject();
            } else resolve(subscription);
        });
    }

    /**
     * Crea una canción con su información para añadirla a la cola.
     */
    protected async createSong(message: Message, url: string): Promise<Song> {
        try {
            const info = await this._youtube.getVideo(url);

            const cancion: ISongData = {
                id: info.id,
                autorID: message.author.id,
                title: info.title,
                url: info.url,
                channelID: info.channel.id,
                duration: info.minutes * 60 + info.seconds,
                likes: info.likes,
                dislikes: info.dislikes,
                views: info.views,
                category: info.category,
                datePublished: info.datePublished
            };

            return new Song(cancion);
        } catch (_) {
            message.reply(this.notaMsg('fail', 'No se econtró ningún video.'));
            return null;
        }
    }

    /**
     * Función principal que reproduce la canción.
     */
    protected playSong(message: Message, song: Song): void {
        this.connectBot(message)
            .then(async (musicConnection) => {
                if (!this._new_song_message && musicConnection.queue.length == 0) this.sendMessage(message, song);

                musicConnection.addedToQueue(song);

                musicConnection.voiceConnection.on('error', (error: Error) => {
                    if (message && message.channel) message.channel.send(this.notaMsg('fail', 'Algo salió mal con la conexión. Volviendo a intentar...'));
                    this.playSong(message, song);
                    throw `Error interno inesperado: ${error.stack}`;
                });
            })
            .catch((error: Error) => {
                throw new Error(`[StarMusic] [Conexión] ${error}`);
            });
    }

    /**
     * Manda el mensaje de reproducción con la información del vídeo.
     * @param message Un mensaje de Discord.
     * @param video Vídeo a mostrar.
     */
    protected async sendMessage(message: Message, video: Song): Promise<void> {
        if (!message.guild) return undefined;
        const subscription = this._subscriptions.get(message.guild.id);
        let resMem = message.client.users.cache.get(`${BigInt(video.autorID)}`);
        if (!resMem) resMem = await message.client.users.fetch(`${BigInt(video.autorID)}`).catch(() => null);

        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed = new MessageEmbed()
                .setColor(this._embed_color)
                .setAuthor('🔊Escuchando a:')
                .setThumbnail(`https://i3.ytimg.com/vi/${video.id}/2.jpg`)
                .setTitle(video.title)
                .setURL(video.url)
                .setDescription(
                    `⏲️Duración: \`${video.duration ? ConvertTime(video.duration) : 'S/D'}\`\nRepetir: \`${
                        !subscription.loop ? 'Desactivado' : subscription.loop == 'single' ? '🔂 Una Canción' : '🔁 Toda la cola de reproducción'
                    }\`\n⏭En cola: \`${subscription.queue.findIndex((sg) => sg.id == video.id) + 1}/${subscription?.queue.length}\``
                )
                .setFooter('Por StarMusic', 'https://i.imgur.com/WKD5uUL.png');
            if (this._show_name)
                embed.setFooter(`Por StarMusic | Solicitado por: ${resMem?.tag || `Usuario desconocido (${video.autorID})`}`, 'https://i.imgur.com/WKD5uUL.png');

            message.channel.send({ embeds: [embed] });
        } else {
            let solicitado = '';
            if (this._show_name) solicitado = `| Solicitado por: \`${resMem?.tag || `Usuario desconocido (${video.autorID})`}\``;

            message.channel.send(
                `🔊Escuchando ahora: **${video.title}** [Video](${video.url})\n⏭En cola: \`${subscription.queue.findIndex((sg) => sg.id == video.id) + 1}/${
                    subscription?.queue.length
                }\`\n👥Vistas: \`${video.views ? ConvertString(video.views) : 'S/D'}\`\nPor StarMusic ${solicitado}`
            );
        }
        // setTimeout(() => this.progressBar(message, video), 500);
    }

    /**
     * Manda el mensaje de barra de progreso de la canción en reproducción.
     * @param message Un mensaje de Discord.
     * @param res Canción en reproducción.
     */
    protected async progressBar(message: Message, res: Song): Promise<void> {
        if (!message.guild) return undefined;
        const voiceConnection = this._subscriptions.get(message.guild.id);
        if (!voiceConnection) return;
        // const dispatcher = voiceConnection.dispatcher;
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed = new MessageEmbed()
                .setColor(this._embed_color)
                .addField(`Reproducción Actual: 00:00 :⏲: ${res.duration ? ConvertTime(res.duration) : '00:00'}`, this._emoji + '────────────────────────────── [0%]');

            message.channel.send({ embeds: [embed] }); /* .then((m) => {
                const tiempoM = setInterval(() => {
                    const duracionD = dispatcher ? dispatcher.streamTime : undefined;

                    if (duracionD) {
                        dispatcher.on('finish', () => clearInterval(tiempoM));
                        dispatcher.on('error', () => clearInterval(tiempoM));

                        if (res.duration) {
                            let porcentaje = (duracionD * 100) / (res.duration * 1000);
                            porcentaje = Math.trunc(porcentaje);
                            const l = '─';
                            let por = (porcentaje * 30) / 100;
                            por = Math.trunc(por);

                            const progreso = `${l.repeat(por)}${this._emoji}${l.repeat(30 - por)} [${porcentaje}%]`;
                            embed.fields = [
                                {
                                    name: `Reproducción Actual: ${ConvertTime(duracionD / 1000)} :⏲: ${ConvertTime(res.duration)}`,
                                    value: progreso
                                }
                            ];
                        } else
                            embed.fields = [
                                {
                                    name: 'Reproducción Actual:',
                                    value: ConvertTime(duracionD / 1000) + ' ⏲'
                                }
                            ];

                        m.edit({ embeds: [embed] });
                    }
                }, 3000);
            }); */
        } else
            message.channel.send(
                `Reproducción Actual: 0:0 :⏲: 0:0
          \n\n${this._emoji}────────────────────────────── [0%]`
            );
        /* .then((m) => {
                    const tiempoM = setInterval(() => {
                        const voiceConnection = this._subscriptions.get(message.guild.id);
                        if (voiceConnection) {
                            const dispatcher = voiceConnection.dispatcher;
                            const duracionD = dispatcher ? dispatcher.streamTime : false;

                            if (duracionD) {
                                dispatcher.on('finish', () => clearInterval(tiempoM));
                                dispatcher.on('error', () => clearInterval(tiempoM));
                                let texto: string;

                                if (res.duration) {
                                    let porcentaje = (duracionD * 100) / (res.duration * 1000);
                                    porcentaje = Math.trunc(porcentaje);
                                    const l = '─'; // 68
                                    let por = (porcentaje * 30) / 100;
                                    por = Math.trunc(por);

                                    const progreso = `${l.repeat(por)}${this._emoji}${l.repeat(30 - por)} [${porcentaje}%]`;
                                    texto = `Reproducción Actual: ${ConvertTime(duracionD / 1000)} :⏲: ${ConvertTime(res.duration)}\n\n${progreso}`;
                                } else texto = 'Reproducción Actual:' + ConvertTime(duracionD / 1000) + ' ⏲';

                                m.edit(texto);
                            }
                        }
                    }, 2000);
                }); */
    }

    protected async sendMessageAddQueue(message: Message, video: Song): Promise<void> {
        const subscription = this._subscriptions.get(message.guild.id);
        let resMem = message.client.users.cache.get(`${BigInt(video.autorID)}`);
        if (!resMem) resMem = await message.client.users.fetch(`${BigInt(video.autorID)}`).catch(() => null);

        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed = new MessageEmbed()
                .setColor(this._embed_color)
                .setAuthor('⏭️Agregado a Cola:')
                .setThumbnail(`https://i3.ytimg.com/vi/${video.id}/2.jpg`)
                .setDescription(
                    `**${video.title}** [Video](${video.url})\n⏲️Duración: \`${video.duration ? ConvertTime(video.duration) : 'S/D'}\`\nEn cola: \`${
                        subscription.queue.length
                    }\``
                )
                .setFooter('Por StarMusic', 'https://i.imgur.com/WKD5uUL.png');
            if (this._show_name) embed.setFooter(`Solicitado por: ${resMem?.username || `Usuario desconocido (${video.autorID})`}`, 'https://i.imgur.com/WKD5uUL.png');

            message.channel.send({ embeds: [embed] });
        } else {
            let solicitado = '';
            if (this._show_name) solicitado = `| Solicitado por: \`${resMem?.tag || `Usuario desconocido (${video.autorID})`}\``;

            message.channel.send(
                `⏭️Agregado a cola: **${video.title}** [Video](${video.url})\n⏲️Duración: \`${video.duration ? ConvertTime(video.duration) : 'S/D'}\`\nEn cola: \`${
                    subscription?.queue.length
                }\`\nPor StarMusic ${solicitado}`
            );
        }
    }

    /**
     * Mandar mensaje estilizado.
     * @param type El tipo de mensaje que se mandará.
     * @param text Mensaje a mandar.
     */
    protected notaMsg(type: 'wrap' | 'note' | 'search' | 'fail' | 'font' | 'error', text: string): string {
        if (type === 'wrap') {
            const ntext = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            return '```\n' + ntext + '\n```';
        } else if (type === 'note') return ':musical_note: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'search') return ':mag: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'fail') return ':no_entry_sign: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'font')
            return text
                .replace(/`/g, '`' + String.fromCharCode(8203))
                .replace(/@/g, '@' + String.fromCharCode(8203))
                .replace(/\\/g, '\\\\')
                .replace(/\*/g, '\\*')
                .replace(/_/g, '\\_')
                .replace(/~/g, '\\~')
                .replace(/`/g, '\\`');
        else if (type == 'error') throw new Error(`[ERROR] ${text}`);
        else throw new Error(`${type} es un tipo inválido`);
    }
}

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
    embedColor?: ColorsFlags;
    /**
     * Link de la estación por defecto para la radio.
     */
    radioStation?: string;
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
