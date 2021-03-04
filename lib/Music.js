"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytdl_core_discord_1 = __importDefault(require("ytdl-core-discord"));
const popyt_1 = __importDefault(require("popyt"));
const libs_1 = require("./libs");
class Music {
    constructor(options) {
        if (!options)
            throw new Error('No colocales ninguna propiedad, necesitas poner al menos a youtubeKey');
        if (!options.youtubeKey)
            throw new Error('No colocaste la propiedad youtubeKey');
        this._youtubeKey = options.youtubeKey;
        this._embed_color = libs_1.resolveColor(options.embedColor || 'RED');
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
        this._youtube = new popyt_1.default(this._youtubeKey);
        this._guilds = new Map();
    }
    start() {
        console.info('Nada que iniciar.');
    }
    async updatePositions(server, obj, songs) {
        return new Promise((resolve) => {
            let mm = 0;
            const newsongs = [];
            (songs ? songs : obj.songs).forEach((s) => {
                if (s.position !== mm)
                    s.position = mm;
                newsongs.push(s);
                mm++;
            });
            obj.songs = newsongs;
            if (obj.last)
                obj.last.position = 0;
            else {
                obj.songs[0].position = 0;
                obj.last = obj.songs[0];
            }
            resolve(this._guilds.set(server.id, obj).get(server.id));
        });
    }
    isAdmin(member) {
        if (member.id == member.guild.ownerID)
            return true;
        else if (member.roles.cache.find((r) => this._admin_roles.includes(r.id)))
            return true;
        else
            return member.hasPermission('ADMINISTRATOR');
    }
    isDj(member) {
        if (member.roles.cache.find((r) => this._dj_roles.includes(r.id)))
            return true;
        else
            return false;
    }
    canAdjust(member, _guilds) {
        if (_guilds.last?.autorID === member.id)
            return true;
        else if (this.isAdmin(member))
            return true;
        else
            return false;
    }
    setLast(server, ultima) {
        return new Promise((resolve, reject) => {
            const q = this._guilds.get(server.id);
            if (q) {
                q.last = ultima;
                this._guilds.set(server.id, q);
                resolve(q);
            }
            else
                reject('Sin cola de servidor');
        });
    }
    emptyQueue(guild) {
        return new Promise((resolve) => {
            resolve(this._guilds.delete(guild.id));
        });
    }
    musicArraySort(array, n) {
        return Array.from(Array(Math.ceil(array.length / n)), (_, i) => array.slice(i * n, i * n + n));
    }
    isStreamValid(url) {
        const pattern = /^((http|https):\/\/|www)[\w\d.-]+([a-z]{2,4})+(\/[\w\d.?%-=]+)?:\d+(\/\w*)?/gi;
        return pattern.test(url);
    }
    connectBot(message) {
        return new Promise((resolve, reject) => {
            const voiceConnection = message.client.voice?.connections.find((val) => (message.guild ? val.channel.guild.id == message.guild.id : false));
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
                }
                else if (message.member.voice.channel.full) {
                    message.channel.send(this.notaMsg('fail', 'El canal ya está lleno'));
                    reject();
                }
                else
                    this.emptyQueue(message.guild).then(() => reject());
            else if (voiceConnection)
                resolve(voiceConnection);
        });
    }
    playSong(message, servidores) {
        if (servidores.songs.length <= 0) {
            message.channel.send(this.notaMsg('note', 'Reproducción Terminada~'));
            const voiceConnection = message.client.voice?.connections.find((val) => (message.guild ? val.channel.guild.id == message.guild.id : false));
            if (voiceConnection)
                return voiceConnection.disconnect();
            if (message.guild)
                this.emptyQueue(message.guild);
        }
        this.connectBot(message)
            .then(async (connection) => {
            let video;
            if (!servidores.last) {
                video = servidores.songs[0];
                this.sendMessage(message, video);
            }
            else if (servidores.loop == 'all') {
                video = servidores.songs.find((s) => s.position == servidores.last.position + 1);
                if (!video?.id)
                    video = servidores.songs[0];
            }
            else if (servidores.loop == 'single')
                video = servidores.last;
            else
                video = servidores.songs.find((s) => s.position == servidores.last?.position);
            if (!video && message.guild) {
                video = this._guilds.get(message.guild.id)?.songs[0];
                if (!video) {
                    message.channel.send(this.notaMsg('note', 'Reproducción Terminada'));
                    this.emptyQueue(message.guild);
                    const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild?.id);
                    if (voiceConnection)
                        return voiceConnection.disconnect();
                    else
                        return await this.emptyQueue(message.guild);
                }
            }
            if (this._new_song_message && servidores.last && message.guild && servidores.loop !== 'single' && video)
                this.sendMessage(message, video);
            if (video) {
                let dispatcher;
                try {
                    servidores = await this.setLast(message.guild, video);
                    dispatcher = connection.play(await ytdl_core_discord_1.default(`https://www.youtube.com/watch?v=${video.id}`), {
                        type: 'opus',
                        bitrate: this._bitrate,
                        volume: servidores.volume / 100
                    });
                }
                catch (error) {
                    throw `${error}`;
                }
                connection.on('error', (error) => {
                    if (message && message.channel)
                        message.channel.send(this.notaMsg('fail', 'Algo salió mal con la conexión. Volviendo a intentar...'));
                    this.playSong(message, servidores);
                    throw `Error interno inesperado: ${error.stack}`;
                });
                dispatcher.on('error', (error) => {
                    if (message && message.channel)
                        message.channel.send(this.notaMsg('fail', 'Algo salió mal al tocar música. Volviendo a intentar...'));
                    this.playSong(message, servidores);
                    throw `Error interno inesperado: ${error.stack}`;
                });
                dispatcher.on('finish', () => {
                    setTimeout(async () => {
                        if (!message.guild)
                            return;
                        if (servidores.songs.length > 0) {
                            if (!servidores.loop) {
                                this._guilds.get(message.guild.id).songs.shift();
                                servidores = this._guilds.get(message.guild.id);
                                this.playSong(message, await this.updatePositions(message.guild, servidores));
                            }
                            else if (servidores.loop)
                                this.playSong(message, servidores);
                        }
                        else {
                            message.channel.send(this.notaMsg('note', 'Reproducción Terminada.'));
                            this.emptyQueue(message.guild);
                            const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
                            if (voiceConnection)
                                return voiceConnection.disconnect();
                        }
                    }, 1250);
                });
            }
        })
            .catch((error) => {
            throw new Error(`[StarMusic] [Conexión] ${error}`);
        });
    }
    sendMessage(message, video) {
        if (!message.guild)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        const resMem = message.client.users.cache.get(video.autorID);
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = {
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
                        value: `📅Publicado el: ${video.datePublished || 'S/D'}\n⏲️Duración: ${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}\n�Vistas: ${video.views ? libs_1.ConvertString(video.views) : 'S/D'}\n�👍Me Gusta: ${video.likes ? libs_1.ConvertString(video.likes) : 'S/D'}\n👎No Me Gusta: ${video.dislikes ? libs_1.ConvertString(video.dislikes) : 'S/D'}`
                    }
                ],
                footer: {
                    text: this._show_name ? `Solicitado por: ${resMem ? resMem.username : `\`Usuario desconocido (ID: ${video.autorID})\``}` : '',
                    icon_url: resMem ? resMem.displayAvatarURL() : undefined
                }
            };
            message.channel.send({ embed });
        }
        else {
            let solicitado = '';
            if (this._show_name && resMem)
                solicitado = `\nSolicitado por: ${resMem.username}`;
            if (this._show_name && !resMem)
                solicitado = `\nSolicitado por: \`Usuario desconocido (ID: ${video.autorID})\``;
            message.channel.send(`
            🔊Escuchando ahora: **${video.title}**${solicitado}\n⏭En cola: ${servidores?.songs.length}
            👥Vistas: ${video.views ? libs_1.ConvertString(video.views) : 'S/D'}
            👍Me Gusta: ${video.likes ? libs_1.ConvertString(video.likes) : 'S/D'}\n👎No Me Gusta: ${video.dislikes ? libs_1.ConvertString(video.dislikes) : 'S/D'}`);
        }
        setTimeout(() => this.progressBar(message, video), 500);
    }
    async progressBar(message, res) {
        if (!message.guild)
            return undefined;
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
        if (!voiceConnection)
            return;
        const dispatcher = voiceConnection.dispatcher;
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = {
                type: 'rich',
                color: this._embed_color,
                fields: [
                    {
                        name: `Reproducción Actual: 00:00 :⏲: ${res.duration ? libs_1.ConvertTime(res.duration) : '00:00'}`,
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
                                    name: `Reproducción Actual: ${libs_1.ConvertTime(duracionD / 1000)} :⏲: ${libs_1.ConvertTime(res.duration)}`,
                                    value: progreso
                                }
                            ];
                        }
                        else
                            embed.fields = [
                                {
                                    name: 'Reproducción Actual:',
                                    value: libs_1.ConvertTime(duracionD / 1000) + ' ⏲'
                                }
                            ];
                        m.edit({ embed });
                    }
                }, 3000);
            });
        }
        else
            message.channel
                .send(`Reproducción Actual: 0:0 :⏲: 0:0
          \n\n${this._emoji}────────────────────────────── [0%]`)
                .then((m) => {
                const tiempoM = setInterval(() => {
                    const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
                    if (voiceConnection) {
                        const dispatcher = voiceConnection.dispatcher;
                        const duracionD = dispatcher ? dispatcher.streamTime : false;
                        if (duracionD) {
                            dispatcher.on('finish', () => clearInterval(tiempoM));
                            dispatcher.on('error', () => clearInterval(tiempoM));
                            let texto;
                            if (res.duration) {
                                let porcentaje = (duracionD * 100) / (res.duration * 1000);
                                porcentaje = Math.trunc(porcentaje);
                                const l = '─';
                                let por = (porcentaje * 30) / 100;
                                por = Math.trunc(por);
                                const progreso = `${l.repeat(por)}${this._emoji}${l.repeat(30 - por)} [${porcentaje}%]`;
                                texto = `Reproducción Actual: ${libs_1.ConvertTime(duracionD / 1000)} :⏲: ${libs_1.ConvertTime(res.duration)}\n\n${progreso}`;
                            }
                            else
                                texto = 'Reproducción Actual:' + libs_1.ConvertTime(duracionD / 1000) + ' ⏲';
                            m.edit(texto);
                        }
                    }
                }, 2000);
            });
    }
    async addedToQueue(message, video) {
        if (!message.guild)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        let resMem = message.client.users.cache.get(video.autorID);
        if (!resMem)
            try {
                resMem = await message.client.users.fetch(video.autorID);
            }
            catch (_) { }
        if (!video.duration || !video.datePublished) {
            const result = await this._youtube.searchVideos(video.id, 1);
            if (result.results[0]) {
                video.duration = result.results[0].minutes * 60 + result.results[0].seconds;
                video.datePublished = result.results[0].datePublished;
            }
        }
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = {
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
                        value: `📅Publicado el: ${video.datePublished || 'S/D'}\n⏲️Duración: ${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}`
                    }
                ],
                footer: {
                    text: this._show_name ? `Solicitado por: ${resMem ? resMem.username : `\`Usuario desconocido (ID: ${video.autorID})\``}` : '',
                    icon_url: resMem ? resMem.displayAvatarURL() : undefined
                }
            };
            message.channel.send({ embed });
        }
        else
            try {
                let solicitado = '';
                if (this._show_name && resMem)
                    solicitado = `\nSolicitado por: ${resMem.username}`;
                if (this._show_name && !resMem)
                    solicitado = `\nSolicitado por: \`Usuario desconocido (ID: ${video.autorID})\``;
                message.channel.send(`⏭️Agregado a cola: **${video.title}**${solicitado}\nEn cola: ${servidores?.songs.length}\n📅Publicado el: ${video.datePublished || 'S/D'}\n⏲️Duración: ${video.duration}`);
            }
            catch (e) {
                throw new Error(`error interno inesperado: ${e.stack}`);
            }
    }
    notaMsg(type, text) {
        if (type === 'wrap') {
            const ntext = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            return '```\n' + ntext + '\n```';
        }
        else if (type === 'note')
            return ':musical_note: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'search')
            return ':mag: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'fail')
            return ':no_entry_sign: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
        else if (type === 'font')
            return text
                .replace(/`/g, '`' + String.fromCharCode(8203))
                .replace(/@/g, '@' + String.fromCharCode(8203))
                .replace(/\\/g, '\\\\')
                .replace(/\*/g, '\\*')
                .replace(/_/g, '\\_')
                .replace(/~/g, '\\~')
                .replace(/`/g, '\\`');
        else if (type == 'error')
            throw new Error(`[ERROR] ${text}`);
        else
            throw new Error(`${type} es un tipo inválido`);
    }
}
exports.default = Music;
