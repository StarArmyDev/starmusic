"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const libs_1 = require("./libs");
const discord_js_1 = require("discord.js");
const Suscription_1 = require("./Suscription");
const Song_1 = require("./Song");
const popyt_1 = __importDefault(require("popyt"));
class Music {
    constructor(options) {
        this._subscriptions = new Map();
        if (!options)
            throw new Error('No colocales ninguna propiedad, necesitas poner al menos a youtubeKey');
        if (!options.youtubeKey)
            throw new Error('No colocaste la propiedad youtubeKey');
        this._youtubeKey = options.youtubeKey;
        this._embed_color = libs_1.resolveColor(libs_1.Colors[options.embedColor] || libs_1.Colors.RED);
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
        this._youtube = new popyt_1.default(this._youtubeKey);
    }
    isAdmin(member) {
        if (member.id == member.guild.ownerID)
            return true;
        else if (member.roles.cache.find((r) => this._admin_roles.includes(r.id)))
            return true;
        else
            return member.permissions.has('ADMINISTRATOR');
    }
    isDj(member) {
        if (member.roles.cache.find((r) => this._dj_roles.includes(r.id)))
            return true;
        else
            return false;
    }
    musicArraySort(array, n) {
        return Array.from(Array(Math.ceil(array.length / n)), (_, i) => array.slice(i * n, i * n + n));
    }
    isStreamValid(url) {
        const pattern = /^((http|https):\/\/|www)[\w\d.-]+([a-z]{2,4})+(\/[\w\d.?%-=]+)?:\d+(\/\w*)?/gi;
        return pattern.test(url);
    }
    getSong(message) {
        const subscription = this._subscriptions.get(message.guild.id);
        if (subscription?.audioPlayer && subscription.audioPlayer.state.status !== voice_1.AudioPlayerStatus.Idle)
            return subscription.audioPlayer.state.resource.metadata;
    }
    connectBot(message) {
        let subscription = this._subscriptions.get(message.guild.id);
        return new Promise((resolve, reject) => {
            if (!subscription) {
                const connection = voice_1.joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: true
                });
                subscription = new Suscription_1.MusicSubscription(connection, {
                    onStart: (song) => {
                        if (this._new_song_message)
                            this.sendMessage(message, song);
                    },
                    onAddQueue: (song) => {
                        this.sendMessageAddQueue(message, song);
                    },
                    onFinish: (sub) => {
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
                voice_1.entersState(connection, voice_1.VoiceConnectionStatus.Ready, 20000)
                    .then(() => {
                    this._subscriptions.set(message.guild.id, subscription);
                    resolve(subscription);
                })
                    .catch(() => {
                    connection.destroy();
                    message.reply(this.notaMsg('fail', 'No pude unirme al canal de voz. Vuelva a intentarlo más tarde.'));
                    reject();
                });
            }
            else if (!message.member.voice.channel.joinable) {
                message.reply(this.notaMsg('fail', 'No tengo permiso para unirme a tu canal de voz'));
                reject();
            }
            else if (message.member.voice.channel.full) {
                message.reply(this.notaMsg('fail', 'El canal ya está lleno'));
                reject();
            }
            else
                resolve(subscription);
        });
    }
    async createSong(message, url) {
        try {
            const info = await this._youtube.getVideo(url);
            const cancion = {
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
            return new Song_1.Song(cancion);
        }
        catch (_) {
            message.reply(this.notaMsg('fail', 'No se econtró ningún video.'));
            return null;
        }
    }
    playSong(message, song) {
        this.connectBot(message)
            .then(async (musicConnection) => {
            if (!this._new_song_message && musicConnection.queue.length == 0)
                this.sendMessage(message, song);
            musicConnection.addedToQueue(song);
            musicConnection.voiceConnection.on('error', (error) => {
                if (message && message.channel)
                    message.channel.send(this.notaMsg('fail', 'Algo salió mal con la conexión. Volviendo a intentar...'));
                this.playSong(message, song);
                throw `Error interno inesperado: ${error.stack}`;
            });
        })
            .catch((error) => {
            throw new Error(`[StarMusic] [Conexión] ${error}`);
        });
    }
    async sendMessage(message, video) {
        if (!message.guild)
            return undefined;
        const subscription = this._subscriptions.get(message.guild.id);
        let resMem = message.client.users.cache.get(`${BigInt(video.autorID)}`);
        if (!resMem)
            resMem = await message.client.users.fetch(`${BigInt(video.autorID)}`).catch(() => null);
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = new discord_js_1.MessageEmbed()
                .setColor(this._embed_color)
                .setAuthor('🔊Escuchando a:')
                .setThumbnail(`https://i3.ytimg.com/vi/${video.id}/2.jpg`)
                .setTitle(video.title)
                .setURL(video.url)
                .setDescription(`⏲️Duración: \`${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}\`\nRepetir: \`${!subscription.loop ? 'Desactivado' : subscription.loop == 'single' ? '🔂 Una Canción' : '🔁 Toda la cola de reproducción'}\`\n⏭En cola: \`${subscription.queue.findIndex((sg) => sg.id == video.id) + 1}/${subscription?.queue.length}\``)
                .setFooter('Por StarMusic', 'https://i.imgur.com/WKD5uUL.png');
            if (this._show_name)
                embed.setFooter(`Por StarMusic | Solicitado por: ${resMem?.tag || `Usuario desconocido (${video.autorID})`}`, 'https://i.imgur.com/WKD5uUL.png');
            message.channel.send({ embeds: [embed] });
        }
        else {
            let solicitado = '';
            if (this._show_name)
                solicitado = `| Solicitado por: \`${resMem?.tag || `Usuario desconocido (${video.autorID})`}\``;
            message.channel.send(`🔊Escuchando ahora: **${video.title}** [Video](${video.url})\n⏭En cola: \`${subscription.queue.findIndex((sg) => sg.id == video.id) + 1}/${subscription?.queue.length}\`\n👥Vistas: \`${video.views ? libs_1.ConvertString(video.views) : 'S/D'}\`\nPor StarMusic ${solicitado}`);
        }
    }
    async progressBar(message, res) {
        if (!message.guild)
            return undefined;
        const voiceConnection = this._subscriptions.get(message.guild.id);
        if (!voiceConnection)
            return;
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = new discord_js_1.MessageEmbed()
                .setColor(this._embed_color)
                .addField(`Reproducción Actual: 00:00 :⏲: ${res.duration ? libs_1.ConvertTime(res.duration) : '00:00'}`, this._emoji + '────────────────────────────── [0%]');
            message.channel.send({ embeds: [embed] });
        }
        else
            message.channel.send(`Reproducción Actual: 0:0 :⏲: 0:0
          \n\n${this._emoji}────────────────────────────── [0%]`);
    }
    async sendMessageAddQueue(message, video) {
        const subscription = this._subscriptions.get(message.guild.id);
        let resMem = message.client.users.cache.get(`${BigInt(video.autorID)}`);
        if (!resMem)
            resMem = await message.client.users.fetch(`${BigInt(video.autorID)}`).catch(() => null);
        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
            const embed = new discord_js_1.MessageEmbed()
                .setColor(this._embed_color)
                .setAuthor('⏭️Agregado a Cola:')
                .setThumbnail(`https://i3.ytimg.com/vi/${video.id}/2.jpg`)
                .setDescription(`**${video.title}** [Video](${video.url})\n⏲️Duración: \`${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}\`\nEn cola: \`${subscription.queue.length}\``)
                .setFooter('Por StarMusic', 'https://i.imgur.com/WKD5uUL.png');
            if (this._show_name)
                embed.setFooter(`Solicitado por: ${resMem?.username || `Usuario desconocido (${video.autorID})`}`, 'https://i.imgur.com/WKD5uUL.png');
            message.channel.send({ embeds: [embed] });
        }
        else {
            let solicitado = '';
            if (this._show_name)
                solicitado = `| Solicitado por: \`${resMem?.tag || `Usuario desconocido (${video.autorID})`}\``;
            message.channel.send(`⏭️Agregado a cola: **${video.title}** [Video](${video.url})\n⏲️Duración: \`${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}\`\nEn cola: \`${subscription?.queue.length}\`\nPor StarMusic ${solicitado}`);
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
