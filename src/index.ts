/* ========================================================== */
/*                         StarMusic                          */
/* ========================================================== */
/*                                                            */
/*                      DavichoStar#8104                      */
/*       Servidor de Soporte: https://discord.gg/DsYhNKd      */
/*                                                            */
/* ========================================================== */
import { Message } from 'discord.js';
import ytpl from 'ytpl';
import { ICancion } from './interfaces';
// import { ConvertString, ConvertTime } from './libs';
import Music from './Music';

export default class StarMusic extends Music {
    // Inicio

    play(message: Message, search: string): void {
        if (!message.guild) message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member!.voice.channel) message.channel.send(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (!search) message.channel.send(this.notaMsg('fail', '¡No has colocado nada que buscar!'));
        else if (message.member && this._just_dj && (this.isDj(message.member) || this.isAdmin(message.member)))
            message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
        else {
            let servidores = this._guilds.get(message.guild.id);
            if (!servidores) {
                this._guilds.set(message.guild.id, {
                    songs: [],
                    id: message.guild.id,
                    volume: this._volume_default,
                    isRadio: false
                });
                servidores = this._guilds.get(message.guild.id)!;
            }
            if (servidores.isRadio) this.leave(message);
            if (servidores.songs.length >= this._max_tail && this._max_tail > 0) message.channel.send(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado'));
            else {
                let searchstring = search.trim();

                if (searchstring.startsWith('http') && searchstring.includes('list=')) {
                    message.channel.send(this.notaMsg('search', 'Buscando elementos de la lista de reproducción~'));
                    let playid = searchstring.toString().split('list=')[1];

                    if (playid.toString().includes('?')) playid = playid.split('?')[0];
                    if (playid.toString().includes('&t=')) playid = playid.split('&t=')[0];

                    ytpl(playid)
                        .then((result) => {
                            if (result.items.length <= 0)
                                return message.channel.send(this.notaMsg('fail', 'No se pudo obtener ningún video de esa lista de reproducción.'));
                            if (result.items.length > this._max_tail)
                                return message.channel.send(this.notaMsg('fail', 'Demasiados videos para poner en cola. Se permite un máximo de 50..'));
                            let index = 0;
                            let ran = 0;

                            result.items.forEach((video) => {
                                ran++;
                                if ((servidores!.songs.length > this._max_tail && this._max_tail > 0) || !video) return;

                                const cancion: ICancion = {
                                    id: video.id,
                                    autorID: message.author.id,
                                    position: servidores?.songs.length || 0,
                                    title: video.title,
                                    url: video.url,
                                    channelId: video.author.channelID,
                                    duration: video.durationSec
                                };

                                servidores!.songs.push(cancion);

                                if (servidores?.songs.length === 1) this.playSong(message, servidores);
                                index++;
                            });

                            if (ran >= result.items.length)
                                if (index == 0) message.channel.send(this.notaMsg('fail', 'No pude obtener ninguna canción de esa lista de reproducción'));
                                else if (index == 1) message.channel.send(this.notaMsg('note', '⏭️En cola una canción.'));
                                else if (index > 1) message.channel.send(this.notaMsg('note', `️⏭️️En cola ${index} canciones.`));
                        })
                        .catch(() => message.channel.send(this.notaMsg('fail', 'Algo salió mal al buscar esa lista de reproducción')));
                } else {
                    if (searchstring.includes('https://youtu.be/') || (searchstring.includes('https://www.youtube.com/') && searchstring.includes('&')))
                        searchstring = searchstring.split('&')[0];
                    message.channel.send(this.notaMsg('search', `\`Buscando: ${searchstring}\`...`));

                    this._youtube
                        .searchVideos(searchstring, 1)
                        .then((result) => {
                            if (result.results.length === 0) return message.channel.send(this.notaMsg('fail', 'No se econtró ningún video.'));

                            const cancion: ICancion = {
                                id: result.results[0].id,
                                autorID: message.author.id,
                                position: servidores?.songs.length || 0,
                                title: result.results[0].title,
                                url: result.results[0].url,
                                channelId: result.results[0].channelId,
                                duration: result.results[0].seconds,
                                likes: result.results[0].likes,
                                dislikes: result.results[0].dislikes,
                                views: result.results[0].views,
                                category: result.results[0].category,
                                datePublished: result.results[0].datePublished
                            };

                            if (servidores!.songs.find((c) => c.id == cancion.id))
                                return message.reply('Esa canción ya está en cola, espera a que acabe para escucharla otra vez.');
                            else servidores!.songs.push(cancion);

                            if (servidores!.songs.length === 1 || !message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild!.id))
                                this.playSong(message, servidores!);
                            else this.addedToQueue(message, cancion);
                        })
                        .catch((err: Error) => {
                            message.channel.send(this.notaMsg('fail', 'Algo salio mal'));
                            throw new Error(`[StarMusic] Error Interno Inesperado: ${err.stack}`);
                        });
                }
            }
        }
    }

    /* search = (message: Message, args: string) => {
        if (!message.member!.voice.channel) return message.channel.send(this.notaMsg('fail', `No estas en un canal de voz`));
        if (!args) return message.channel.send(this.notaMsg('fail', 'No especificaste algo qué buscar'));

        if (this.servidores.has(message.guild!.id) && this.servidores.get(message.guild!.id).isRadio) this.salir(message);
        if (!this.servidores.has(message.guild!.id))
            this.servidores.set(message.guild!.id, {
                canciones: [],
                ultima: null,
                repetir: 'Ninguna',
                id: message.guild!.id,
                volumen: this.volumenDef,
                isRadio: false
            });
        if (this.soloDj && this.isDj(message.member!))
            return message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));

        const servidores: ServerOpts = this.servidores.get(message.guild!.id);
        if (servidores.canciones.length >= this.colaMax && this.colaMax !== 0)
            return message.channel.send(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado!'));

        let searchstring = args.trim();
        message.channel
            .send(this.notaMsg('search', `Buscando: \`${searchstring}\``))
            .then((response: unknown) => {
                this.searcher
                    .search(searchstring, {
                        type: 'video'
                    })
                    .then((searchResult: unknown) => {
                        if (!searchResult.totalResults || searchResult.totalResults === 0)
                            return response.edit(this.notaMsg('fail', 'Error al obtener resultados de búsqueda.'));

                        const startTheFun = async (videos: unknown, max: unknown) => {
                            if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild!.me!)!.has('EMBED_LINKS')) {
                                const embed: MessageEmbed = new MessageEmbed();
                                embed.setTitle(`Elige tu video`);
                                embed.setColor(this.embedColor);
                                var index = 0;
                                videos.forEach(function (video: unknown) {
                                    index++;
                                    embed.addField(`${index} (${video.channelTitle})`, `[${notaMsg('font', video.title)}](${video.url})`, true);
                                });
                                if (this.mostrarNombre) embed.setFooter(`Buscado por: ${message.author.username}`, message.author.displayAvatarURL());

                                message.channel.send({ embed: embed }).then((firstMsg: unknown) => {
                                    const filter: CollectorFilter = (m: Message) => {
                                        let contents: boolean[] = [];
                                        for (let i = 0; i < max; i++) {
                                            contents.push(m.content.includes((i + 1).toString()));
                                        }
                                        return (
                                            (m.author.id == message.author.id && contents.includes(true)) ||
                                            m.content.trim() == `cancel` ||
                                            m.content.trim() == `cancelar`
                                        );
                                    };
                                    setTimeout(() => {
                                        message.channel
                                            .awaitMessages(filter, {
                                                max: 1,
                                                time: 60000,
                                                errors: ['time']
                                            })
                                            .then((collected: unknown) => {
                                                const newColl: Array<unknown> = Array.from(collected);
                                                const mcon = newColl[0][1].content;

                                                if (mcon === 'cancel' || mcon === 'cancelar') return firstMsg.edit(this.notaMsg('note', 'Búsqueda cancelada.'));

                                                const song_number: number = parseInt(mcon) - 1;
                                                if (song_number >= 0) {
                                                    firstMsg.delete();

                                                    let cancion = {
                                                        id: videos[song_number].id,
                                                        autorID: message.author.id,
                                                        position: servidores.canciones.length ? servidores.canciones.length : 0,
                                                        title: videos[song_number].channelTitle,
                                                        url: videos[song_number].url,
                                                        owner: {
                                                            name: videos[song_number].name,
                                                            id: videos[song_number].channelId,
                                                            image: null
                                                        }
                                                    };
                                                    servidores.canciones.push(cancion);

                                                    if (
                                                        servidores.canciones.length === 1 ||
                                                        (client.voice && !client.voice.connections.find((val) => val.channel.guild.id == message.guild!.id))
                                                    )
                                                        this.iniciar(message, servidores);
                                                    else this.buscar_info(message, cancion, true);
                                                }
                                            })
                                            .catch((collected: unknown) => {
                                                if (collected.toString().match(/error|Error|TypeError|RangeError|Uncaught/))
                                                    return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                                return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada.\n\`\`\``);
                                            });
                                    }, 500);
                                });
                            } else {
                                const vids = videos
                                    .map(
                                        (video: unknown, index: unknown) =>
                                            `**${index + 1}:** __${video.title
                                                .replace(/\\/g, '\\\\')
                                                .replace(/\`/g, '\\`')
                                                .replace(/\* /g, '\\*')
                                                .replace(/_/g, '\\_')
                                                .replace(/~/g, '\\~')
                                                .replace(/`/g, '\\`')}__`
                                    )
                                    .join('\n\n');
                                message.channel
                                    .send(`\`\`\`\n= Elige tu video =\n${vids}\n\n= Ponga \`cancelar\` o \`cancel\` para cancelar la búsqueda.`)
                                    .then((firstMsg: unknown) => {
                                        const filter: CollectorFilter = (m: Message) => {
                                            let contents: boolean[] = [];
                                            for (let i = 0; i < max; i++) {
                                                contents.push(m.content.includes((i + 1).toString()));
                                            }
                                            return (
                                                (m.author.id === message.author.id && contents.includes(true)) ||
                                                m.content.trim() === `cancel` ||
                                                m.content.trim() === `cancelar`
                                            );
                                        };
                                        message.channel
                                            .awaitMessages(filter, {
                                                max: 1,
                                                time: 60000,
                                                errors: ['time']
                                            })
                                            .then((collected: unknown) => {
                                                const newColl: Array<unknown> = Array.from(collected);
                                                const mcon = newColl[0][1].content;

                                                if (mcon === 'cancel' || mcon === 'cancelar') return firstMsg.edit(this.notaMsg('note', 'Búsqueda cancelada.'));
                                                const song_number = parseInt(mcon) - 1;
                                                if (song_number >= 0) {
                                                    firstMsg.delete();

                                                    let cancion = {
                                                        id: videos[song_number].id,
                                                        autorID: message.author.id,
                                                        position: servidores.canciones.length ? servidores.canciones.length : 0,
                                                        title: videos[song_number].channelTitle,
                                                        url: videos[song_number].url,
                                                        owner: {
                                                            name: videos[song_number].name,
                                                            id: videos[song_number].channelId,
                                                            image: null
                                                        }
                                                    };
                                                    servidores.canciones.push(cancion);
                                                    if (
                                                        servidores.canciones.length === 1 ||
                                                        (client.voice && !client.voice.connections.find((val) => val.channel.guild.id == message.guild!.id))
                                                    )
                                                        this.iniciar(message, servidores);
                                                    else this.buscar_info(message, cancion, true);
                                                }
                                            })
                                            .catch((collected: unknown) => {
                                                if (collected.toString().match(/error|Error|TypeError|RangeError|Uncaught/))
                                                    return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                                return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada.\n\`\`\``);
                                            });
                                    });
                            }
                        };

                        const max = searchResult.totalResults >= 10 ? 9 : searchResult.totalResults - 1;
                        var videos: Array<unknown> = [];
                        for (var i = 0; i < 99; i++) {
                            var result = searchResult.currentPage[i];
                            result.autorID = message.author.id;
                            videos.push(result);
                            if (i === max) {
                                i = 101;
                                startTheFun(videos, max);
                            }
                        }
                    });
            })
            .catch((err: Error) => {
                throw new Error(`error interno inesperado: ${err.stack}`);
            });
    };

    radio = (message: Message, stream: unknown = false) => {
        if (message.member && !message.member.voice.channel) return message.channel.send(this.notaMsg('fail', `No estas en un canal de voz.`));

        if (!this.servidores.has(message.guild! ? message.guild!.id : '0') && message.guild!)
            this.servidores.set(message.guild!.id, {
                canciones: [],
                ultima: null,
                repetir: 'Ninguna',
                id: message.guild!.id,
                autorID: message.author.id,
                volumen: this.volumenDef,
                isRadio: true
            });

        if (this.soloDj && message.member && this.isDj(message.member))
            return message.channel.send(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));

        new Promise((resolve, reject) => {
            let voiceConnection: VoiceConnection | undefined = client.voice
                ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
                : undefined;
            if (voiceConnection === null) {
                if (message.member && message.member.voice.channel && message.member.voice.channel.joinable) {
                    message.member.voice.channel
                        .join()
                        .then((connection: VoiceConnection) => {
                            resolve(connection);
                        })
                        .catch((error: Error) => {
                            throw new Error(`error interno inesperado: ${error.stack}`);
                        });
                } else if (
                    message.member &&
                    message.member.voice &&
                    message.member.voice.channel &&
                    (!message.member.voice.channel.joinable || message.member.voice.channel.full)
                ) {
                    message.channel.send(this.notaMsg('fail', '¡No tengo permiso para unirme a tu canal de voz!'));
                    reject();
                } else reject();
            } else resolve(voiceConnection);
        }).then(async (connection: unknown) => {
            if (stream && stream.length > 1) {
                let estadoServer = await laut.getServerStatus();
                if (!estadoServer || !estadoServer.running) return message.channel.send(`Servidor de Radio No disponible: \`${estadoServer.message}\``);

                stream = await laut.searchStations({ query: stream, limit: 1 }).catch((err: Error) => {
                    throw new Error(`error interno inesperado: ${err.stack}`);
                });
                let rdio = stream.results[0].items[0].station;

                connection.play(rdio.stream_url, {
                    bitrate: this.bitRate,
                    volume: message.guild! ? this.servidores.get(message.guild!.id).volumen / 100 : this.volumenDef
                });
                let horaR = new Date(rdio.updated_at);

                const embed: MessageEmbed = new MessageEmbed()
                    .setColor(rdio.color.length > 1 ? rdio.color : rdio.curren_playlist.color.length > 1 ? rdio.curren_playlist.color : 'RANDOM')
                    .setThumbnail(rdio.images.station).setDescription(`:radio: Radio ${client.user ? client.user.username : 'StarMusic'} Activado~
          \n🎶◉Estación: [.::\`${rdio.display_name}\`::.]
          \nDescripción: \`${rdio.description}\`
          \nDj's: ${rdio.djs.length > 1 ? rdio.djs : "Sin Dj's"} | Lugar: ${rdio.location.length > 1 ? rdio.location : 'Desconocido'}
          \n▶PlayList en Reproducción: ${rdio.current_playlist.name}
          \n🕐Fecha de la Emisora: ${horaR} | 🕥Termina: ${rdio.current_playlist.end_time}:00 hrs
          \n▶PlayList que Sigue: ${rdio.next_playlist.name}
          \n🕐Empieza: ${rdio.next_playlist.hour}:00 hrs | 🕥Termina: ${rdio.next_playlist.end_time}:00 hrs
          \n📶◉En Línea: [24/7]`);
                message.channel.send({ embed: embed });
            } else {
                connection.play(this.estacionRadio, {
                    bitrate: this.bitRate,
                    volume: message.guild! ? this.servidores.get(message.guild!.id).volumen / 100 : this.volumenDef
                });
                const embed: MessageEmbed = new MessageEmbed().setColor('RANDOM').setDescription(`:radio: Radio ${
                    client.user ? client.user.username : 'StarMusic'
                } Activado~
          \n🎶◉Escuchando: [.::\`${this.estacionRadio}\`::.]
          \n📶◉En Línea: [24/7]`);
                message.channel.send({ embed: embed });
            }
        });
    };

    pause = (message: Message) => {
        const voiceConnection: VoiceConnection | undefined = client.voice
            ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
            : undefined;
        if (!voiceConnection) return message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música.'));
        if (message.guild! && this.servidores.get(message.guild!.id).isRadio)
            return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        let authorC = this.servidores.get(message.guild! ? message.guild!.id : '0').ultima;
        if (authorC.autorID != message.author.id && message.member && !this.isAdmin(message.member) && !this.cualquieraPausa)
            return message.channel.send(this.notaMsg('fail', 'No tienes permiso de pausar.'));

        const dispatcher: StreamDispatcher = voiceConnection.dispatcher;
        if (dispatcher.paused) return message.channel.send(this.notaMsg(`fail`, `¡La música ya está en pausa!`));
        else dispatcher.pause(true);
        message.channel.send(this.notaMsg('note', 'Reproducción en pausa.'));
    };

    resume = (message: Message) => {
        const voiceConnection: VoiceConnection | undefined = client.voice
            ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
            : undefined;
        if (!voiceConnection) return message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música'));
        if (!message.guild!) return;
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        let authorC = this.servidores.get(message.guild!.id).ultima;
        if (authorC.autorID != message.author.id && message.member && !this.isAdmin(message.member) && !this.cualquieraPausa)
            return message.channel.send(this.notaMsg('fail', `No tienes permiso de reanudar.`));

        const dispatcher: StreamDispatcher = voiceConnection.dispatcher;
        if (!dispatcher.paused) return message.channel.send(this.notaMsg('fail', `La música no está páusada.`));
        else dispatcher.resume();
        message.channel.send(this.notaMsg('note', 'Reproducción Reanudada.'));
    };

    skip = (message: Message) => {
        const voiceConnection: VoiceConnection | undefined = client.voice
            ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
            : undefined;
        if (!message.guild! || !message.member) return;
        const servidores: ServerOpts = this.servidores.get(message.guild!.id);
        let authorC = this.servidores.get(message.guild!.id).ultima;

        if (!voiceConnection) return message.channel.send(this.notaMsg('fail', 'No se está reproduciendo música.'));
        if (servidores.isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        if (!this.canSkip(message.member, servidores))
            return message.channel.send(this.notaMsg('fail', `No puedes saltear esto porque no hay una cola de reproducción.`));
        if (authorC.autorID != message.author.id && !this.isAdmin(message.member) && !this.cualquieraOmite)
            return message.channel.send(this.notaMsg('fail', 'No tienes permiso de omitir.'));
        if (this.servidores.get(message.guild!.id).repetir == 'canción')
            return message.channel.send(this.notaMsg('fail', 'No se puede omitir mientras que el bucle está configurado como simple.'));

        const dispatcher: StreamDispatcher = voiceConnection.dispatcher;
        if (!dispatcher || dispatcher === null) return message.channel.send(this.notaMsg('fail', 'Algo salió mal corriendo y saltando.'));
        if (dispatcher.paused) dispatcher.destroy();
        dispatcher.destroy();
        message.channel.send(this.notaMsg('note', 'Canción omitida.'));
    }; */

    leave(message: Message): void {
        if (!message.guild || !message.member) message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else {
            const servidores = this._guilds.get(message.guild.id);
            const authorC = servidores?.last;
            const radio = servidores?.isRadio;
            if (radio || this._any_take_out || this.isAdmin(message.member) || authorC?.autorID == message.author.id) {
                const voiceConnection = message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild!.id);
                if (!voiceConnection) message.channel.send(this.notaMsg('fail', 'No estoy en un canal de voz.'));
                else {
                    this.emptyQueue(message.guild);

                    if (voiceConnection.dispatcher) voiceConnection.dispatcher.destroy();
                    voiceConnection.disconnect();
                    message.channel.send(this.notaMsg('note', 'Dejé con éxito el canal de voz.'));
                }
            } else message.channel.send(this.notaMsg('fail', `Me temo que no puedo dejar que hagas eso, ${message.author.username}.`));
        }
    }

    /*
    np = (message: Message) => {
        const voiceConnection: VoiceConnection | undefined = client.voice
            ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
            : undefined;
        const servidores: ServerOpts = this.servidores.get(message.guild!.id);
        if (!voiceConnection) return message.channel.send(this.notaMsg('fail', 'No hay Música sonando.'));

        if (servidores.canciones.length <= 0) return message.channel.send(this.notaMsg('note', 'Cola vacía.'));
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));

        if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild!.me!)!.has('EMBED_LINKS')) {
            try {
                const embed: MessageEmbed = new MessageEmbed()
                    .setAuthor(client.user ? client.user.username : 'StarMusic', client.user ? client.user.displayAvatarURL() : undefined)
                    .setColor(this.embedColor)
                    .setThumbnail(servidores.ultima.owner.image)
                    .setImage(`https://i3.ytimg.com/vi/${servidores.ultima.id}/2.jpg`)
                    .setColor(this.embedColor)
                    .addField(
                        '🔊Escuchando:',
                        `[${servidores.ultima.title}](${servidores.ultima.url}) por: 👤[${servidores.ultima.owner.name}](https://www.youtube.com/channel/${servidores.ultima.owner.id})`,
                        true
                    )
                    .addField('⏭En Cola', servidores.canciones.length, true);
                const resMem = client.users.cache.get(servidores.ultima.autorID);
                if (this.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL());
                if (this.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${servidores.ultima.autorID})\``);

                message.channel.send({ embed: embed });
            } catch (e) {
                throw new Error(`error interno inesperado: ${e.stack}`);
            }
        } else {
            try {
                let solicitado = '';
                const resMem = client.users.cache.get(servidores.ultima.autorID);
                if (this.mostrarNombre && resMem) solicitado = `Solicitado por: ${resMem.username}`;
                if (this.mostrarNombre && !resMem) solicitado = `Solicitado por: \`Usuario desconocido (ID: ${servidores.ultima.autorID})\``;

                message.channel.send(`🔊Escuchando: **${servidores.ultima.title}**
      \npor: 👤[${servidores.ultima.owner.name}](https://www.youtube.com/channel/${servidores.ultima.owner.id})
      \n${solicitado}
      \n⏭En Cola: ${servidores.canciones.length}`);
            } catch (e) {
                throw new Error(`error interno inesperado: ${e.stack}`);
            }
        }
        this.reproductor(message, servidores.ultima);
    };

    repeat = (message: Message, args: string) => {
        if (!message.guild!) return;
        if (!this.servidores.has(message.guild!.id)) return message.channel.send(this.notaMsg('fail', `No se ha encontrado ninguna cola para este servidor!`));
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));

        if (parseInt(args) == 1 || (!args && this.servidores.get(message.guild!.id).repetir == 'Ninguna')) {
            this.servidores.get(message.guild!.id).repetir = 'canción';
            message.channel.send(this.notaMsg('note', '¡Repetir una cancíon habilitado! :repeat_one:'));
        } else if (parseInt(args) == 2 || (!args && this.servidores.get(message.guild!.id).repetir == 'canción')) {
            this.servidores.get(message.guild!.id).repetir = 'todo';
            message.channel.send(this.notaMsg('note', '¡Repetir Cola habilitada! :repeat:'));
        } else if (parseInt(args) == 0 || parseInt(args) == 3 || (!args && this.servidores.get(message.guild!.id).repetir == 'todo')) {
            this.servidores.get(message.guild!.id).repetir = 'Ninguna';
            message.channel.send(this.notaMsg('note', '¡Repetir canciones deshabilitado! :arrow_forward:'));
            const voiceConnection: VoiceConnection | undefined = client.voice
                ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
                : undefined;
            if (!voiceConnection || !message.guild!) return;
            const dispatcher: StreamDispatcher = voiceConnection.dispatcher;
            let wasPaused: boolean = dispatcher.paused;
            if (wasPaused) dispatcher.pause();
            let newq = this.servidores.get(message.guild!.id).canciones.slice(this.servidores.get(message.guild!.id).ultima.position - 1);
            if (newq !== this.servidores.get(message.guild!.id).canciones)
                this.updatePositions(newq, message.guild!).then((res: unknown) => (this.servidores.get(message.guild! ? message.guild!.id : '0').canciones = res));
            if (wasPaused) dispatcher.resume();
        }
    };

    queue = (message: Message, args: string) => {
        if (!message.guild!) return;
        if (!this.servidores.has(message.guild!.id)) return message.channel.send(this.notaMsg('fail', 'No se pudo encontrar una cola para este servidor.'));
        else if (this.servidores.get(message.guild!.id).canciones.length <= 0) return message.channel.send(this.notaMsg('fail', 'La cola esta vacía.'));
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        const servidores = this.servidores.get(message.guild!.id);

        const embed: MessageEmbed = new MessageEmbed().setColor(this.embedColor);

        if (args) {
            let video = servidores.canciones.find((s: unknown) => s.position == parseInt(args) - 1);
            if (!video) return message.channel.send(this.notaMsg('fail', 'No pude encontrar ese video.'));
            embed
                .setAuthor('Canción en cola', client.user ? client.user.displayAvatarURL() : undefined)
                .setTitle(video.owner.name)
                .setURL(`https://www.youtube.com/channel/${video.owner.id}`)
                .setDescription(`[${video.title}](${video.url})\nDuración: ${typeof video.duracion == 'number' ? ConvertTime(video.duracion) : video.duracion}`)
                .addField('En Cola', servidores.canciones.length, true)
                .addField('Posición', video.position + 1, true)
                .setThumbnail(`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`);
            const resMem = client.users.cache.get(video.autorID);
            if (this.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL());
            if (this.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${video.autorID})\``);
            message.channel.send({ embed });
        } else {
            if (servidores.canciones.length > 11) {
                let pages: Array<unknown> = [];
                let page = 1;
                const newSongs = servidores.canciones.musicArraySort(10);
                newSongs.forEach((s: unknown) => {
                    var i = s.map((video: unknown, index: unknown) => `**${video.position + 1}:** __${video.title}__`).join('\n\n');
                    if (i !== undefined) pages.push(i);
                });

                embed
                    .setAuthor('Canciones en cola', client.user ? client.user.displayAvatarURL() : undefined)
                    .setFooter(`Página ${page} de ${pages.length}`)
                    .setDescription(pages[page - 1]);
                message.channel.send({ embed: embed }).then(async (m: unknown) => {
                    await m.react('⏪');
                    await m.react('⏩');

                    let siguienteFilter = m.createReactionCollector(
                        (reaction: MessageReaction, user: User) => reaction.emoji.name === '⏩' && user.id === message.author.id,
                        { time: 120000 }
                    );
                    let regresarFilter = m.createReactionCollector(
                        (reaction: MessageReaction, user: User) => reaction.emoji.name === '⏪' && user.id === message.author.id,
                        { time: 120000 }
                    );

                    siguienteFilter.on('collect', (r: unknown) => {
                        if (page === pages.length) return;
                        page++;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit({ embed: embed });
                    });
                    regresarFilter.on('collect', (r: unknown) => {
                        if (page === 1) return;
                        page--;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit({ embed: embed });
                    });
                });
            } else {
                var nuevasC = this.servidores
                    .get(message.guild!.id)
                    .canciones.map((video: unknown, index: unknown) => `**${video.position + 1}:** __${video.title}__`)
                    .join('\n\n');

                embed
                    .setAuthor('Canciones en cola', client.user ? client.user.displayAvatarURL() : undefined)
                    .setDescription(nuevasC)
                    .setFooter(`Página 1 de 1`, message.author.displayAvatarURL());
                return message.channel.send({ embed: embed });
            }
        }
    };

    remove = (message: Message, args: number) => {
        if (!message.guild!) return;
        if (!this.servidores.has(message.guild!.id)) return message.channel.send(this.notaMsg('fail', `No se ha encontrado ninguna cola para este servidor.`));
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        if (!args) return message.channel.send(this.notaMsg('fail', 'No colocaste la posición del video.'));

        if (parseInt(args) - 1 == 0) return message.channel.send(this.notaMsg('fail', 'No puedes borrar la música que se está reproduciendo actualmente.'));
        let cancionR = this.servidores.get(message.guild!.id).canciones.find((x: unknown) => x.position == parseInt(args) - 1);

        if (cancionR) {
            if (cancionR.autorID != message.author.id && message.member && !this.isAdmin(message.member))
                return message.channel.send(this.notaMsg('fail', 'No puedes eliminar esta canción.'));
            let newq = this.servidores.get(message.guild!.id).canciones.filter((s: unknown) => s !== cancionR);
            this.updatePositions(newq, message.guild!).then((res: unknown) => {
                this.servidores.get(message.guild! ? message.guild!.id : '0').canciones = res;
                message.channel.send(this.notaMsg('note', `Eliminado:  \`${cancionR.title}\``));
            });
        } else message.channel.send(this.notaMsg('fail', 'No se pudo encontrar ese video o algo salió mal.'));
    };

    volume = (message: Message, args: number) => {
        const voiceConnection: VoiceConnection | undefined = client.voice
            ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
            : undefined;
        if (!voiceConnection || !message.guild! || !message.member) return message.channel.send(this.notaMsg('fail', 'No se reproduce música.'));
        if (this.servidores.get(message.guild!.id).isRadio) return message.channel.send(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        if (!this.canAdjust(message.member, this.servidores.get(message.guild!.id)))
            return message.channel.send(this.notaMsg('fail', `Sólo los administradores o DJ's pueden cambiar el volumen.`));
        const dispatcher: StreamDispatcher = voiceConnection.dispatcher;

        if (!args || isNaN(args)) return message.channel.send(this.notaMsg('fail', 'Sin volumen especificado.'));
        if (args > 200 || args <= 0) return message.channel.send(this.notaMsg('fail', 'Volumen fuera de rango, debe estar dentro de 1 a 200'));

        dispatcher.setVolume(args / 100);
        this.servidores.get(message.guild!.id).volumen = args;
        message.channel.send(this.notaMsg('note', `Volumen cambiado a ${args}%.`));
    };

    clear = (message: Message) => {
        if (!message.guild! || !message.member) return;
        if (!this.servidores.has(message.guild!.id)) return message.channel.send(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor..'));
        if (this.djRol && !this.isDj(message.member) && !this.isAdmin(message.member))
            return message.channel.send(this.notaMsg('fail', `Sólo los administradores o personas con el ${this.djRol} puede borrar colas.`));
        let emptyQueue: Promise<boolean> = this.emptyQueue(message.guild!);
        if (emptyQueue) {
            message.channel.send(this.notaMsg('note', 'Cola borrada.'));
            const voiceConnection: VoiceConnection | undefined = client.voice
                ? client.voice.connections.find((val) => (message.guild! ? val.channel.guild.id == message.guild!.id : false))
                : undefined;
            if (voiceConnection) {
                const dispatcher: StreamDispatcher = voiceConnection.dispatcher;
                if (!dispatcher) {
                    new Error(`dispatcher nulo en saltar cmd [${message.guild!.name}] [${message.author.username}]`);
                    return message.channel.send(this.notaMsg('fail', 'Algo salió mal.'));
                }
                if (dispatcher.paused) dispatcher.destroy();
                dispatcher.destroy();
            }
        } else {
            new Error(`[clearCmd] [${message.guild!.id}] ${emptyQueue}`);
            return message.channel.send(this.notaMsg('fail', 'Algo salió mal limpiando la cola.'));
        }
    };
*/
}

/* const start = (client: Client) => {
    Object.defineProperty(Array.prototype, 'musicArraySort', {
        value: function (n: unknown) {
            return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
        }
    });
}; */
