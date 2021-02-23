import { Guild, GuildMember, Message, VoiceConnection } from 'discord.js';
import { ICancion, MusicOpts, ServerOpts, embedJSON } from './interfaces';
import ytdl from 'ytdl-core-discord';
import popyt from 'popyt';
import { ConvertString, ConvertTime, resolveColor } from './libs';

export default abstract class Music {
    /**
     *
     */
    protected _youtube: popyt;

    /**
     * Servidores con lista de reproducción.
     */
    protected _guilds: Map<string, ServerOpts>;

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
     * Volumen por defecto del bot.
     */
    protected _volume_default: number;

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

    /* protected abstract searcher: unknown;

    protected abstract buscar_info: (message: Message, video: unknown, cola?: boolean) => void;
    protected abstract agregado_a_cola: (message: unknown, video: unknown) => void;
    protected abstract mensaje: (message: unknown, video: unknown) => Promise<void>;
    protected abstract reproductor: (message: unknown, video: unknown) => Promise<void>; */

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
        this._embed_color = resolveColor(options.embedColor || 'RED');
        this._radio_station = options.radioStation || 'http://hd.digitalradio.mx:5883/;';
        this._volume_default = options.volumeDefault || 50;
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
        this._guilds = new Map();
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
     * Establece el volumen del bot.
     * @param message Un mensaje de Discord.
     * @param volume El nivel del volumen a establecer.
     */
    public abstract volume(message: Message, volume: number): void;

    /**
     * Limpia la cola actual de reproducción.
     * @param message Un mensaje de Discord.
     */
    public abstract clear(message: Message): void;

    /**
     * Inicia el módulo.
     */
    start(): void {
        console.info('Nada que iniciar.');
    }

    // ? ================== ? //
    // ! Funciones internas ! //
    // ? ================== ? //

    /**
     * Actualizar la posición de las canciones.
     * @param obj
     * @param server Un servidor de Discord.
     */
    protected async updatePositions(server: Guild, obj: ServerOpts, songs?: ICancion[]): Promise<ServerOpts> {
        return new Promise((resolve) => {
            let mm = 0;
            const newsongs: ICancion[] = [];
            (songs ? songs : obj.songs).forEach((s) => {
                if (s.position !== mm) s.position = mm;
                newsongs.push(s);
                mm++;
            });

            obj.songs = newsongs;

            if (obj.last) obj.last.position = 0;
            else {
                obj.songs[0].position = 0;
                obj.last = obj.songs[0];
            }
            resolve(this._guilds.set(server.id, obj).get(server.id)!);
        });
    }

    /**
     * Validar si el usuario es administrador.
     * @param member Un usuario de un servidor de Discord
     */
    protected isAdmin(member: GuildMember): boolean {
        if (member.id == member.guild.ownerID) return true;
        else if (member.roles.cache.find((r) => this._admin_roles.includes(r.id))) return true;
        else return member.hasPermission('ADMINISTRATOR');
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
     * Verifica si un miembro puede ajustar propiedades de la canción actual.
     * @param member Un miembro de Discord.
     * @param _guilds Cola de canciones y ajustes de la reproducción.
     */
    protected canAdjust(member: GuildMember, _guilds: ServerOpts): boolean {
        if (_guilds.last?.autorID === member.id) return true;
        else if (this.isAdmin(member)) return true;
        else return false;
    }

    protected setLast(server: Guild, ultima: ICancion): Promise<ServerOpts> {
        return new Promise((resolve: (value: ServerOpts) => void, reject: (value: string) => void) => {
            const q = this._guilds.get(server.id);
            if (q) {
                q.last = ultima;
                this._guilds.set(server.id, q);
                resolve(q);
            } else reject('Sin cola de servidor');
        });
    }

    /**
     * Vacía la cola del servidor
     * @param guild Un servidor de Discord.
     */
    protected emptyQueue(guild: Guild): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(this._guilds.delete(guild.id));
        });
    }

    /**
     *
     * @param n Cantidad de datos a retornar.
     */
    protected musicArraySort(array: ICancion[], n: number): ICancion[][] {
        return Array.from(Array(Math.ceil(array.length / n)), (_, i) => array.slice(i * n, i * n + n));
    }

    protected isStreamValid(url: string): boolean {
        const pattern = /^((http|https):\/\/|www)[\w\d.-]+([a-z]{2,4})+(\/[\w\d.?%-=]+)?:\d+(\/\w*)?/gi;

        if (!url || url == '') return false;
        return pattern.test(url);
    }

    /**
     * Conecta al bot en un canal de voz.
     * @param message Un mensaje de Discord
     */
    protected connectBot(message: Message): Promise<VoiceConnection> {
        return new Promise((resolve: (value: VoiceConnection) => void, reject) => {
            const voiceConnection = message.client.voice?.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false));
            if (!voiceConnection && message.member && message.guild)
                if (message.member.voice.channel?.joinable)
                    message.member.voice.channel
                        .join()
                        .then((connection) => {
                            connection.setMaxListeners(0);
                            resolve(connection);
                        })
                        .catch((error) => reject(new Error(`[StarMusic] [Conexión Canal] error: ${error}`)));
                else if (!message.member.voice.channel?.joinable) {
                    message.channel.send(this.notaMsg('fail', 'No tengo permiso para unirme a tu canal de voz'));
                    reject();
                } else if (message.member.voice.channel.full) {
                    message.channel.send(this.notaMsg('fail', 'El canal ya está lleno'));
                    reject();
                } else this.emptyQueue(message.guild).then(() => reject());
            else if (voiceConnection) resolve(voiceConnection);
        });
    }

    /**
     * Función principal que reproduce la canción.
     */
    protected playSong(message: Message, servidores: ServerOpts): unknown {
        if (servidores.songs.length <= 0) {
            message.channel.send(this.notaMsg('note', 'Reproducción Terminada~'));
            const voiceConnection = message.client.voice?.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false));
            if (voiceConnection) return voiceConnection.disconnect();
            if (message.guild) this.emptyQueue(message.guild);
        }

        this.connectBot(message)
            .then(async (connection: VoiceConnection) => {
                let video: ICancion | undefined;
                if (!servidores.last) {
                    video = servidores.songs[0];
                    this.sendMessage(message, video);
                } else if (servidores.loop == 'all') {
                    video = servidores.songs.find((s) => s.position == servidores.last!.position + 1);
                    if (!video?.id) video = servidores.songs[0];
                } else if (servidores.loop == 'single') video = servidores.last;
                else video = servidores.songs.find((s) => s.position == servidores.last?.position);

                if (!video && message.guild) {
                    video = this._guilds.get(message.guild!.id)?.songs[0];
                    if (!video) {
                        message.channel.send(this.notaMsg('note', 'Reproducción Terminada'));
                        this.emptyQueue(message.guild!);
                        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild?.id);
                        if (voiceConnection) return voiceConnection.disconnect();
                        else return await this.emptyQueue(message.guild);
                    }
                }

                if (this._new_song_message && servidores.last && message.guild && servidores.loop !== 'single' && video) this.sendMessage(message, video);

                if (video) {
                    let dispatcher;
                    try {
                        servidores = await this.setLast(message.guild!, video);
                        dispatcher = connection.play(await ytdl(`https://www.youtube.com/watch?v=${video.id}`), {
                            type: 'opus',
                            bitrate: this._bitrate,
                            volume: servidores.volume / 100
                        });
                    } catch (error) {
                        throw `${error}`;
                    }

                    connection.on('error', (error: Error) => {
                        new Error(`error interno inesperado: ${error.stack}`);
                        if (message && message.channel) message.channel.send(this.notaMsg('fail', 'Algo salió mal con la conexión. Volviendo a intentar...'));
                        this.playSong(message, servidores);
                    });

                    dispatcher.on('error', (error: Error) => {
                        new Error(`error interno inesperado: ${error.stack}`);
                        if (message && message.channel) message.channel.send(this.notaMsg('fail', 'Algo salió mal al tocar música. Volviendo a intentar...'));
                        this.playSong(message, servidores);
                    });

                    dispatcher.on('finish', () => {
                        setTimeout(async () => {
                            if (!message.guild) return;
                            if (servidores.songs.length > 0) {
                                if (!servidores.loop) {
                                    this._guilds.get(message.guild!.id)!.songs.shift();
                                    servidores = this._guilds.get(message.guild!.id)!;
                                    this.playSong(message, await this.updatePositions(message.guild, servidores));
                                } else if (servidores.loop) this.playSong(message, servidores);
                            } else {
                                message.channel.send(this.notaMsg('note', 'Reproducción Terminada.'));
                                this.emptyQueue(message.guild);
                                const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild!.id);
                                if (voiceConnection) return voiceConnection.disconnect();
                            }
                        }, 1250);
                    });
                }
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
    protected sendMessage(message: Message, video: ICancion): void {
        if (!message.guild) return undefined;
        const servidores = this._guilds.get(message.guild.id);
        const resMem = message.client.users.cache.get(video.autorID);

        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed: embedJSON = {
                type: 'rich',
                color: this._embed_color,
                author: {
                    name: message.client.user?.username || '🎶 StarMusic',
                    url: message.client.user?.displayAvatarURL()
                },
                thumbnail: {
                    url: `https://i3.ytimg.com/vi/${video.id}/2.jpg`
                },
                fields: [
                    {
                        name: '🔊Escuchando',
                        value: `**${video.title}**\n[YouTube](${video.url}) por: 👤[Canal](https://www.youtube.com/channel/${video.channelId})`
                    },
                    {
                        name: '⏭En cola',
                        value: `${servidores?.songs.length || 0}`
                    },
                    {
                        name: 'Estadísticas',
                        value: `📅Publicado el: ${video.datePublished || 'S/D'}\n⏲️Duración: ${video.duration ? ConvertTime(video.duration) : 'S/D'}\n�Vistas: ${
                            video.views ? ConvertString(video.views) : 'S/D'
                        }\n�👍Me Gusta: ${video.likes ? ConvertString(video.likes) : 'S/D'}\n👎No Me Gusta: ${video.dislikes ? ConvertString(video.dislikes) : 'S/D'}`
                    }
                ],
                footer: {
                    text: this._show_name ? `Solicitado por: ${resMem ? resMem.username : `\`Usuario desconocido (ID: ${video.autorID})\``}` : '',
                    icon_url: resMem ? resMem.displayAvatarURL() : undefined
                }
            };

            message.channel.send({ embed });
        } else {
            let solicitado = '';
            if (this._show_name && resMem) solicitado = `\nSolicitado por: ${resMem.username}`;
            if (this._show_name && !resMem) solicitado = `\nSolicitado por: \`Usuario desconocido (ID: ${video.autorID})\``;

            message.channel.send(`
            🔊Escuchando ahora: **${video.title}**${solicitado}\n⏭En cola: ${servidores?.songs.length}
            👥Vistas: ${video.views ? ConvertString(video.views) : 'S/D'}
            👍Me Gusta: ${video.likes ? ConvertString(video.likes) : 'S/D'}\n👎No Me Gusta: ${video.dislikes ? ConvertString(video.dislikes) : 'S/D'}`);
        }
        setTimeout(() => this.progressBar(message, video), 500);
    }

    /**
     * Manda el mensaje de barra de progreso de la canción en reproducción.
     * @param message Un mensaje de Discord.
     * @param res Canción en reproducción.
     */
    protected async progressBar(message: Message, res: ICancion): Promise<void> {
        if (!message.guild) return undefined;
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild!.id);
        if (!voiceConnection) return;
        const dispatcher = voiceConnection.dispatcher;
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed: embedJSON = {
                type: 'rich',
                color: this._embed_color,
                fields: [
                    {
                        name: `Reproducción Actual: 00:00 :⏲: ${res.duration ? ConvertTime(res.duration) : '00:00'}`,
                        value: this._emoji + '────────────────────────────── [0%]'
                    }
                ]
            };

            message.channel.send({ embed }).then((m) => {
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

                        m.edit({ embed });
                    }
                }, 3000);
            });
        } else
            message.channel
                .send(
                    `Reproducción Actual: 0:0 :⏲: 0:0
          \n\n${this._emoji}────────────────────────────── [0%]`
                )
                .then((m) => {
                    const tiempoM = setInterval(() => {
                        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild!.id);
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
                });
    }

    /**
     * Agrega una canción a la lista de reproducción.
     * @param message Un mensaje de Discord.
     * @param video Canción a mostrar.
     */
    protected async addedToQueue(message: Message, video: ICancion): Promise<void> {
        if (!message.guild) return undefined;
        const servidores = this._guilds.get(message.guild.id);
        let resMem = message.client.users.cache.get(video.autorID);
        if (!resMem)
            try {
                resMem = await message.client.users.fetch(video.autorID);
            } catch (_) {}

        if (!video.duration || !video.datePublished) {
            const result = await this._youtube.searchVideos(video.id, 1);
            if (result.results[0]) {
                video.duration = result.results[0].seconds;
                video.datePublished = result.results[0].datePublished;
            }
        }

        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me!)!.has('EMBED_LINKS')) {
            const embed: embedJSON = {
                type: 'rich',
                color: this._embed_color,
                author: {
                    name: '⏭️Agregando a la cola',
                    url: message.client.user?.displayAvatarURL()
                },
                thumbnail: {
                    url: `https://i3.ytimg.com/vi/${video.id}/2.jpg`
                },
                fields: [
                    {
                        name: 'Agregado a Cola',
                        value: `**${video.title}** [Link](${video.url}) [Canal](https://www.youtube.com/channel/${video.channelId})`
                    },
                    {
                        name: '⏭En cola',
                        value: `${servidores?.songs.length || 0}`
                    },
                    {
                        name: 'Estadísticas',
                        value: `📅Publicado el: ${video.datePublished || 'S/D'}\n⏲️Duración: ${video.duration ? ConvertTime(video.duration) : 'S/D'}`
                    }
                ],
                footer: {
                    text: this._show_name ? `Solicitado por: ${resMem ? resMem.username : `\`Usuario desconocido (ID: ${video.autorID})\``}` : '',
                    icon_url: resMem ? resMem.displayAvatarURL() : undefined
                }
            };

            message.channel.send({ embed });
        } else
            try {
                let solicitado = '';
                if (this._show_name && resMem) solicitado = `\nSolicitado por: ${resMem.username}`;
                if (this._show_name && !resMem) solicitado = `\nSolicitado por: \`Usuario desconocido (ID: ${video.autorID})\``;

                message.channel.send(
                    `⏭️Agregado a cola: **${video.title}**${solicitado}\nEn cola: ${servidores?.songs.length}\n📅Publicado el: ${
                        video.datePublished || 'S/D'
                    }\n⏲️Duración: ${video.duration}`
                );
            } catch (e) {
                throw new Error(`error interno inesperado: ${e.stack}`);
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
