"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ytpl_1 = __importDefault(require("ytpl"));
const libs_1 = require("./libs");
const Music_1 = __importDefault(require("./Music"));
class StarMusic extends Music_1.default {
    play(message, search) {
        if (!message.guild || !message.member)
            message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member.voice.channel)
            message.channel.send(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (!search)
            message.channel.send(this.notaMsg('fail', '¡No has colocado nada que buscar!'));
        else if (this._just_dj && (this.isDj(message.member) || this.isAdmin(message.member)))
            message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
        else {
            let servidores = this._guilds.get(message.guild.id);
            if (!servidores) {
                this._guilds.set(message.guild.id, {
                    songs: [],
                    volume: this._volume_default,
                    isRadio: false
                });
                servidores = this._guilds.get(message.guild.id);
            }
            if (servidores.isRadio)
                this.leave(message);
            if (servidores.songs.length >= this._max_tail && this._max_tail > 0)
                message.channel.send(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado'));
            else {
                let searchstring = search.trim();
                if (searchstring.startsWith('http') && searchstring.includes('list=')) {
                    message.channel.send(this.notaMsg('search', 'Buscando elementos de la lista de reproducción~'));
                    let playid = searchstring.toString().split('list=')[1];
                    if (playid.toString().includes('?'))
                        playid = playid.split('?')[0];
                    if (playid.toString().includes('&t='))
                        playid = playid.split('&t=')[0];
                    ytpl_1.default(playid)
                        .then((result) => {
                        if (result.items.length <= 0)
                            return message.channel.send(this.notaMsg('fail', 'No se pudo obtener ningún video de esa lista de reproducción.'));
                        if (result.items.length > this._max_tail)
                            return message.channel.send(this.notaMsg('fail', 'Demasiados videos para poner en cola. Se permite un máximo de 50..'));
                        let index = 0;
                        let ran = 0;
                        result.items.forEach((video) => {
                            ran++;
                            if ((servidores.songs.length > this._max_tail && this._max_tail > 0) || !video)
                                return;
                            const cancion = {
                                id: video.id,
                                autorID: message.author.id,
                                position: servidores.songs.length || 0,
                                title: video.title,
                                url: video.url,
                                channelId: video.author.channelID,
                                duration: video.durationSec
                            };
                            servidores.songs.push(cancion);
                            if (servidores.songs.length === 1)
                                this.playSong(message, servidores);
                            index++;
                        });
                        if (ran >= result.items.length)
                            if (index == 0)
                                message.channel.send(this.notaMsg('fail', 'No pude obtener ninguna canción de esa lista de reproducción'));
                            else if (index == 1)
                                message.channel.send(this.notaMsg('note', '⏭️En cola una canción.'));
                            else if (index > 1)
                                message.channel.send(this.notaMsg('note', `️⏭️️En cola ${index} canciones.`));
                    })
                        .catch(() => message.channel.send(this.notaMsg('fail', 'Algo salió mal al buscar esa lista de reproducción')));
                }
                else {
                    if (searchstring.includes('https://youtu.be/') || (searchstring.includes('https://www.youtube.com/') && searchstring.includes('&')))
                        searchstring = searchstring.split('&')[0];
                    message.channel.send(this.notaMsg('search', `\`Buscando: ${searchstring}\`...`));
                    this._youtube
                        .getVideo(searchstring)
                        .then((result) => {
                        const cancion = {
                            id: result.id,
                            autorID: message.author.id,
                            position: servidores.songs.length || 0,
                            title: result.title,
                            url: result.url,
                            channelId: result.channelId,
                            duration: result.minutes * 60 + result.seconds,
                            likes: result.likes,
                            dislikes: result.dislikes,
                            views: result.views,
                            category: result.category,
                            datePublished: result.datePublished
                        };
                        if (servidores.songs.find((c) => c.id == cancion.id))
                            return message.reply('Esa canción ya está en cola, espera a que acabe para escucharla otra vez.');
                        else
                            servidores.songs.push(cancion);
                        if (servidores.songs.length === 1 || !message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id))
                            this.playSong(message, servidores);
                        else
                            this.addedToQueue(message, cancion);
                    })
                        .catch(() => message.channel.send(this.notaMsg('fail', 'No se econtró ningún video.')));
                }
            }
        }
    }
    search(message, search) {
        if (!message.guild || !message.member)
            message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member.voice.channel)
            message.channel.send(this.notaMsg('fail', 'No estas en un canal de voz'));
        else if (!search)
            message.channel.send(this.notaMsg('fail', 'No especificaste algo qué buscar'));
        else {
            let servidores = this._guilds.get(message.guild.id);
            if (servidores?.isRadio)
                this.leave(message);
            if (!servidores && message.guild)
                servidores = this._guilds
                    .set(message.guild.id, {
                    songs: [],
                    volume: this._volume_default,
                    isRadio: false
                })
                    .get(message.guild.id);
            if (this._just_dj && !this.isDj(message.member) && !this.isAdmin(message.member))
                message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
            else if (servidores.songs.length >= this._max_tail && this._max_tail > 0)
                message.channel.send(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado!'));
            else {
                const searchstring = search.trim();
                message.channel
                    .send(this.notaMsg('search', `Buscando: \`${searchstring}\``))
                    .then((response) => {
                    this._youtube
                        .searchVideos(searchstring, 10)
                        .then((searchResult) => {
                        if (searchResult.results.length == 0)
                            return response.edit(this.notaMsg('fail', 'Error al obtener resultados de búsqueda.'));
                        const startTheFun = async (videos, max) => {
                            if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
                                const embed = new discord_js_1.MessageEmbed();
                                embed.setTitle('Elige tu video');
                                embed.setColor(this._embed_color);
                                videos.map((video, index) => embed.addField(`${index + 1}`, `[${this.notaMsg('font', video.title)}](${video.url})`));
                                if (this._show_name)
                                    embed.setFooter(`Buscado por: ${message.author.username}`, message.author.displayAvatarURL());
                                message.channel.send(embed).then((firstMsg) => message.channel
                                    .awaitMessages((m) => {
                                    const contents = [];
                                    for (let i = 0; i < max; i++)
                                        contents.push(m.content.includes((i + 1).toString()));
                                    return ((m.author.id == message.author.id && contents.includes(true)) ||
                                        m.content.trim() == 'cancel' ||
                                        m.content.trim() == 'cancelar');
                                }, {
                                    max: 1,
                                    time: 60000,
                                    errors: ['time']
                                })
                                    .then((collected) => {
                                    const newColl = Array.from(collected);
                                    const mcon = newColl[0][1].content;
                                    if (mcon === 'cancel' || mcon === 'cancelar')
                                        return firstMsg.edit(this.notaMsg('note', 'Búsqueda cancelada.'));
                                    const song_number = parseInt(mcon) - 1;
                                    if (song_number >= 0) {
                                        firstMsg.delete();
                                        const cancion = {
                                            id: videos[song_number].id,
                                            autorID: message.author.id,
                                            position: servidores.songs.length || 0,
                                            title: videos[song_number].title,
                                            url: videos[song_number].url,
                                            channelId: videos[song_number].channelId
                                        };
                                        servidores.songs.push(cancion);
                                        if (servidores.songs.length == 0 ||
                                            !message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id))
                                            this.playSong(message, servidores);
                                        else
                                            this.addedToQueue(message, cancion);
                                    }
                                })
                                    .catch((collected) => {
                                    if (collected.toString().match(/error|Error|TypeError|RangeError|Uncaught/))
                                        return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                    return firstMsg.edit('````xl\nBúsqueda cancelada.\n```');
                                }));
                            }
                            else {
                                const vids = videos
                                    .map((video, index) => `**${index + 1}:** __${video.title
                                    .replace(/\\/g, '\\\\')
                                    .replace(/`/g, '\\`')
                                    .replace(/\* /g, '\\*')
                                    .replace(/_/g, '\\_')
                                    .replace(/~/g, '\\~')
                                    .replace(/`/g, '\\`')}__`)
                                    .join('\n\n');
                                message.channel
                                    .send(`\`\`\`\n= Elige tu video =\n${vids}\n\n= Ponga \`cancelar\` o \`cancel\` para cancelar la búsqueda.`)
                                    .then((firstMsg) => {
                                    message.channel
                                        .awaitMessages((m) => {
                                        const contents = [];
                                        for (let i = 0; i < max; i++)
                                            contents.push(m.content.includes((i + 1).toString()));
                                        return ((m.author.id == message.author.id && contents.includes(true)) ||
                                            m.content.trim() == 'cancel' ||
                                            m.content.trim() == 'cancelar');
                                    }, {
                                        max: 1,
                                        time: 60000,
                                        errors: ['time']
                                    })
                                        .then((collected) => {
                                        const newColl = Array.from(collected);
                                        const mcon = newColl[0][1].content;
                                        if (mcon === 'cancel' || mcon === 'cancelar')
                                            return firstMsg.edit(this.notaMsg('note', 'Búsqueda cancelada.'));
                                        const song_number = parseInt(mcon) - 1;
                                        if (song_number >= 0) {
                                            firstMsg.delete();
                                            const cancion = {
                                                id: videos[song_number].id,
                                                autorID: message.author.id,
                                                position: servidores.songs.length || 0,
                                                title: videos[song_number].title,
                                                url: videos[song_number].url,
                                                channelId: videos[song_number].channelId
                                            };
                                            servidores.songs.push(cancion);
                                            if (servidores.songs.length == 0 ||
                                                !message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id))
                                                this.playSong(message, servidores);
                                            else
                                                this.addedToQueue(message, cancion);
                                        }
                                    })
                                        .catch((collected) => {
                                        if (collected.toString().match(/error|Error|TypeError|RangeError|Uncaught/))
                                            return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                        return firstMsg.edit('````xl\nBúsqueda cancelada.\n```');
                                    });
                                });
                            }
                        };
                        const max = searchResult.results.length >= 10 ? 9 : searchResult.results.length - 1;
                        const videos = [];
                        searchResult.results.forEach((result) => videos.push({
                            id: result.id,
                            autorID: message.author.id,
                            position: servidores.songs.length || 0,
                            title: result.title,
                            url: result.url,
                            channelId: result.channelId,
                            duration: result.seconds,
                            likes: result.likes,
                            dislikes: result.dislikes,
                            views: result.views,
                            category: result.category,
                            datePublished: result.datePublished
                        }));
                        setTimeout(() => startTheFun(videos, max), 200);
                    })
                        .catch(() => response.edit(this.notaMsg('fail', 'Error al obtener resultados de búsqueda.')));
                })
                    .catch((err) => {
                    throw new Error(`Interno Inesperado: ${err.stack}`);
                });
            }
        }
    }
    radio(message, stream) {
        if (!message.guild || !message.member)
            return undefined;
        let servidores = this._guilds.get(message.guild.id);
        if (message.member && !message.member.voice.channel)
            message.channel.send(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (this._just_dj && this.isDj(message.member))
            message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
        if (!servidores)
            servidores = this._guilds
                .set(message.guild.id, {
                songs: [],
                volume: this._volume_default,
                isRadio: true
            })
                .get(message.guild.id);
        else {
            servidores.isRadio = true;
            this._guilds.set(message.guild.id, servidores);
        }
        this.connectBot(message)
            .then(async (connection) => {
            if (stream && stream.length > 1)
                if (this.isStreamValid(stream))
                    message.channel.send(this.notaMsg('fail', 'Link de radio inválido.'));
                else
                    try {
                        connection.play(stream, {
                            type: 'opus',
                            bitrate: this._bitrate,
                            volume: servidores.volume / 100
                        });
                        message.channel.send(new discord_js_1.MessageEmbed().setColor('RANDOM').setDescription(`:radio: Radio ${message.client.user?.username || 'StarMusic'} Activado~
                        \n🎶◉Escuchando: [.::\`${stream}\`::.]
                        \n📶◉En Línea: [24/7]`));
                    }
                    catch (_) {
                        message.channel.send(this.notaMsg('fail', 'Link de radio inválido.'));
                    }
            else {
                connection.play(this._radio_station, {
                    type: 'opus',
                    bitrate: this._bitrate,
                    volume: servidores.volume / 100
                });
                message.channel.send(new discord_js_1.MessageEmbed().setColor('RANDOM').setDescription(`:radio: Radio ${message.client.user?.username || 'StarMusic'} Activado~
                \n🎶◉Escuchando: [.::\`${this._radio_station}\`::.]
                \n📶◉En Línea: [24/7]`));
            }
        })
            .catch((err) => {
            message.channel.send(this.notaMsg('fail', 'No se pudo conectar al canal de voz.'));
            console.error(err);
        });
    }
    pause(message) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
        if (!voiceConnection || !servidores?.last)
            message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música.'));
        else if (message.guild && servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (servidores.last.autorID != message.author.id && message.member && !this.isAdmin(message.member) && !this._any_pause)
            message.channel.send(this.notaMsg('fail', 'No tienes permiso de pausar.'));
        else if (voiceConnection.dispatcher?.paused)
            message.channel.send(this.notaMsg('fail', '¡La música ya está en pausa!'));
        else {
            voiceConnection.dispatcher.pause(true);
            message.channel.send(this.notaMsg('note', 'Reproducción en pausa.'));
        }
    }
    resume(message) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
        if (!voiceConnection || !servidores?.last)
            message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música'));
        else if (servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (servidores.last.autorID != message.author.id && !this.isAdmin(message.member) && !this._any_pause)
            message.channel.send(this.notaMsg('fail', 'No tienes permiso de reanudar.'));
        else if (!voiceConnection.dispatcher?.paused)
            message.channel.send(this.notaMsg('fail', 'La música no está páusada.'));
        else {
            voiceConnection.dispatcher.resume();
            message.channel.send(this.notaMsg('note', 'Reproducción Reanudada.'));
        }
    }
    skip(message) {
        if (!message.guild || !message.member)
            return undefined;
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
        const servidores = this._guilds.get(message.guild.id);
        if (!voiceConnection || !servidores?.last)
            message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música.'));
        else if (servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (!this.canAdjust(message.member, servidores))
            message.channel.send(this.notaMsg('fail', 'No puedes saltear esto porque no hay una cola de reproducción.'));
        else if (servidores.last.autorID != message.author.id && !this.isAdmin(message.member) && !this._any_skip)
            message.channel.send(this.notaMsg('fail', 'No tienes permiso de omitir esta canción.'));
        else if (servidores.loop == 'single')
            message.channel.send(this.notaMsg('fail', 'No se puede omitir mientras que el bucle está configurado como `Una canción`'));
        else if (!voiceConnection.dispatcher)
            message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música.'));
        else {
            voiceConnection.dispatcher.end();
            message.channel.send(this.notaMsg('note', 'Canción omitida.'));
        }
    }
    leave(message) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        const authorC = servidores?.last;
        const radio = servidores?.isRadio;
        if (radio || this._any_take_out || this.isAdmin(message.member) || authorC?.autorID == message.author.id) {
            const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id);
            if (!voiceConnection)
                message.channel.send(this.notaMsg('fail', 'No estoy en un canal de voz.'));
            else {
                this.emptyQueue(message.guild);
                if (voiceConnection.dispatcher)
                    voiceConnection.dispatcher.destroy();
                voiceConnection.disconnect();
                message.channel.send(this.notaMsg('note', 'Dejé con éxito el canal de voz.'));
            }
        }
        else
            message.channel.send(this.notaMsg('fail', `Me temo que no puedo dejar que hagas eso, ${message.author.username}.`));
    }
    np(message) {
        if (!message.guild || !message.member)
            return undefined;
        const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild?.id);
        const servidores = this._guilds.get(message.guild.id);
        if (!voiceConnection)
            message.channel.send(this.notaMsg('fail', 'No hay Música sonando.'));
        else if (!servidores?.last)
            message.channel.send(this.notaMsg('note', 'Cola vacía.'));
        else if (servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else {
            const resMem = message.client.users.cache.get(servidores.last.autorID);
            if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
                const embed = new discord_js_1.MessageEmbed()
                    .setAuthor(message.client.user?.username || 'StarMusic', message.client.user?.displayAvatarURL())
                    .setColor(this._embed_color)
                    .setThumbnail(`https://i3.ytimg.com/vi/${servidores.last.id}/2.jpg`)
                    .addField('🔊Escuchando:', `**${servidores.last.title}**\n[YouTube](${servidores.last.url}) por: 👤[Canal](https://www.youtube.com/channel/${servidores.last.channelId})`, true)
                    .addField('⏭En Cola', servidores.songs.length);
                if (this._show_name && resMem)
                    embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL());
                if (this._show_name && !resMem)
                    embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${servidores.last.autorID})\``);
                message.channel.send(embed);
            }
            else {
                let solicitado = '';
                if (this._show_name && resMem)
                    solicitado = `\nSolicitado por: ${resMem.username}`;
                if (this._show_name && !resMem)
                    solicitado = `\nSolicitado por: <@${servidores.last.autorID}>`;
                message.channel.send(`🔊Escuchando: **${servidores.last.title}**\npor: 👤[Canal](https://www.youtube.com/channel/${servidores.last.channelId})${solicitado}\n⏭En Cola: ${servidores.songs.length}`);
            }
            this.progressBar(message, servidores.last);
        }
    }
    async repeat(message, song) {
        if (!message.guild || !message.member)
            return undefined;
        if (song && (song < 0 || song > 3))
            message.channel.send(this.notaMsg('fail', 'Solamente puedes colocar 0, 1, 2 o 3'));
        let servidores = this._guilds.get(message.guild.id);
        if (!servidores)
            message.channel.send(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor'));
        else {
            if (servidores.isRadio)
                message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
            else if (song == 1 || (!song && !servidores.loop)) {
                servidores.loop = 'single';
                message.channel.send(this.notaMsg('note', '¡Repetir una cancíon habilitado! :repeat_one:'));
            }
            else if (song == 2 || (!song && servidores.loop == 'single')) {
                servidores.loop = 'all';
                message.channel.send(this.notaMsg('note', '¡Repetir Cola habilitada! :repeat:'));
            }
            else if (song == 0 || song == 3 || (!song && servidores.loop == 'all')) {
                servidores.loop = undefined;
                message.channel.send(this.notaMsg('note', '¡Repetir canciones deshabilitado! :arrow_forward:'));
                const voiceConnection = message.client.voice?.connections.find((val) => (message.guild ? val.channel.guild.id == message.guild.id : false));
                if (!voiceConnection)
                    return undefined;
                const dispatcher = voiceConnection.dispatcher;
                if (servidores.last) {
                    const newq = servidores.songs.slice(servidores.last.position - 1);
                    if (newq !== servidores.songs)
                        servidores = await this.updatePositions(message.guild, servidores, newq);
                }
                if (dispatcher.paused)
                    dispatcher.resume();
            }
            this._guilds.set(message.guild.id, servidores);
        }
    }
    queue(message, song) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        if (!servidores)
            message.channel.send(this.notaMsg('fail', 'No se pudo encontrar una cola para este servidor.'));
        else if (servidores.songs.length <= 0)
            message.channel.send(this.notaMsg('fail', 'La cola esta vacía.'));
        else if (servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else {
            const embed = new discord_js_1.MessageEmbed().setColor(this._embed_color);
            if (song) {
                const video = servidores.songs.find((s) => s.position == song - 1);
                if (!video)
                    message.channel.send(this.notaMsg('fail', 'No pude encontrar ese video.'));
                else {
                    embed
                        .setAuthor('Canción en cola', message.client.user?.displayAvatarURL())
                        .setURL(`https://www.youtube.com/channel/${video.channelId}`)
                        .setDescription(`[${video.title}](${video.url})\nDuración: ${video.duration ? libs_1.ConvertTime(video.duration) : 'S/D'}`)
                        .addField('En Cola', servidores.songs.length, true)
                        .addField('Posición', video.position + 1, true)
                        .setThumbnail(`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`);
                    const resMem = message.client.users.cache.get(video.autorID);
                    if (this._show_name && resMem)
                        embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL());
                    if (this._show_name && !resMem)
                        embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${video.autorID})\``);
                    message.channel.send({ embed });
                }
            }
            else if (servidores.songs.length > 11) {
                const pages = [];
                let page = 1;
                const newSongs = this.musicArraySort(servidores.songs, 10);
                newSongs.forEach((s) => {
                    const i = s.map((video) => `**${video.position + 1}:** __${video.title}__`).join('\n\n');
                    if (i !== undefined)
                        pages.push(i);
                });
                embed
                    .setAuthor('Canciones en cola', message.client.user?.displayAvatarURL())
                    .setFooter(`Página ${page} de ${pages.length}`)
                    .setDescription(pages[page - 1]);
                message.channel.send(embed).then(async (m) => {
                    await m.react('⏪');
                    await m.react('⏩');
                    m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id, {
                        time: 120000
                    }).on('collect', () => {
                        if (page === pages.length)
                            return;
                        page++;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit(embed);
                    });
                    m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id, {
                        time: 120000
                    }).on('collect', () => {
                        if (page === 1)
                            return;
                        page--;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit(embed);
                    });
                });
            }
            else
                message.channel.send(embed
                    .setAuthor('Canciones en cola', message.client.user?.displayAvatarURL())
                    .setDescription(servidores.songs.map((video) => `**${video.position + 1}:** __${video.title}__`).join('\n\n'))
                    .setFooter('Página 1 de 1', message.author.displayAvatarURL()));
        }
    }
    remove(message, song) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        if (!servidores)
            message.channel.send(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor.'));
        else if (servidores.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (!song)
            message.channel.send(this.notaMsg('fail', 'No colocaste la posición del video.'));
        else if (song - 1 == 0)
            message.channel.send(this.notaMsg('fail', 'No puedes borrar la música que se está reproduciendo actualmente.'));
        else {
            const cancionR = servidores.songs.find((x) => x.position == song - 1);
            if (!cancionR)
                message.channel.send(this.notaMsg('fail', 'No se pudo encontrar ese video o algo salió mal.'));
            else if (cancionR.autorID == message.author.id || this.isAdmin(message.member))
                this.updatePositions(message.guild, servidores, servidores.songs.filter((s) => s !== cancionR)).then((res) => {
                    this._guilds.set(message.guild.id, res);
                    message.channel.send(this.notaMsg('note', `Eliminado:  \`${cancionR.title}\``));
                });
            else
                message.channel.send(this.notaMsg('fail', 'No puedes eliminar esta canción.'));
        }
    }
    volume(message, volume) {
        if (!message.guild || !message.member)
            return undefined;
        const voiceConnection = message.client.voice?.connections.find((val) => (message.guild ? val.channel.guild.id == message.guild.id : false));
        if (!voiceConnection)
            message.channel.send(this.notaMsg('fail', 'No se reproduce música.'));
        else if (this._guilds.get(message.guild.id)?.isRadio)
            message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (!this.canAdjust(message.member, this._guilds.get(message.guild.id)))
            message.channel.send(this.notaMsg('fail', 'Sólo los administradores o quien puso la canción actual pueden cambiar el volumen.'));
        else {
            const dispatcher = voiceConnection.dispatcher;
            if (!volume)
                message.channel.send(this.notaMsg('fail', 'Sin volumen especificado.'));
            else if (volume > 200 || volume <= 0)
                message.channel.send(this.notaMsg('fail', 'Volumen fuera de rango, debe estar dentro de 1 a 200'));
            else {
                dispatcher.setVolume(volume / 100);
                this._guilds.get(message.guild.id).volume = volume;
                message.channel.send(this.notaMsg('note', `Volumen cambiado a ${volume}%.`));
            }
        }
    }
    clear(message) {
        if (!message.guild || !message.member)
            return undefined;
        const servidores = this._guilds.get(message.guild.id);
        if (!servidores || !servidores.last)
            message.channel.send(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor..'));
        else if (this._just_dj && !this.isDj(message.member) && !this.isAdmin(message.member))
            message.channel.send(this.notaMsg('fail', 'Sólo los administradores o personas con rol de DJ pueden borrar colas.'));
        else if (this.emptyQueue(message.guild)) {
            this._guilds.set(message.guild.id, {
                songs: [servidores.last],
                last: servidores.last,
                volume: this._volume_default,
                isRadio: false
            });
            message.channel.send(this.notaMsg('note', 'Cola borrada.'));
        }
        else {
            message.channel.send(this.notaMsg('fail', 'Algo salió mal limpiando la cola.'));
            throw new Error('[StarMusic] [clearCmd] No Se pudo borrar la cola de reproducción.');
        }
    }
}
exports.default = StarMusic;
