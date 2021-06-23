/* ========================================================== */
/*                         StarMusic                          */
/* ========================================================== */
/*                                                            */
/*                      DavichoStar#8104                      */
/*       Servidor de Soporte: https://discord.gg/DsYhNKd      */
/*                                                            */
/* ========================================================== */
import { AudioPlayerStatus } from '@discordjs/voice';
import { ConvertString, ConvertTime } from './libs';
import { Message, MessageEmbed } from 'discord.js';
import { Video } from 'popyt';
import Music from './Music';
import ytpl from 'ytpl';

/**
 * Módulo de música para bots en Discord.js con el que podrás implementar la capacidad de reproducir
 * música a tus bots, siendo fácil y en español.
 *
 * @author DavichoStar#8104
 * @see https://discord.gg/DsYhNKd
 */
export default class StarMusic extends Music {
    play(message: Message, search: string): void {
        if (!message.guild || !message.member) message.reply(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member.voice.channel) message.reply(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (!search) message.reply(this.notaMsg('fail', '¡No has colocado nada que buscar!'));
        else if (this._just_dj && (this.isDj(message.member) || this.isAdmin(message.member)))
            message.reply(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
        else {
            const song = this.getSong(message);
            let subscription = this._subscriptions.get(message.guild.id);

            if (subscription?.queue.length >= this._max_tail && this._max_tail > 0) message.reply(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado'));
            else if (subscription?.queueLock) message.reply(this.notaMsg('fail', 'Procesando una solicitud previa, intente de nuevo en unos segundos.'));
            else {
                let searchstring = search.trim();

                if (searchstring.startsWith('http') && searchstring.includes('list=')) {
                    message.channel.send(this.notaMsg('search', 'Buscando elementos de la lista de reproducción~'));
                    let playid = searchstring.toString().split('list=')[1];

                    if (playid.toString().includes('?')) playid = playid.split('?')[0];
                    if (playid.toString().includes('&t=')) playid = playid.split('&t=')[0];

                    ytpl(playid)
                        .then((result) => {
                            if (result.items.length <= 0) return message.reply(this.notaMsg('fail', 'No se pudo obtener ningún video de esa lista de reproducción.'));
                            if (result.items.length > this._max_tail)
                                return message.reply(this.notaMsg('fail', `Demasiados videos para poner en cola. Se permite un máximo de ${this._max_tail}.`));
                            let index = 0;
                            let ran = 0;

                            const promesas: Promise<void>[] = [];

                            const getVideo = async (video: ytpl.Item): Promise<void> => {
                                if (!subscription) await this.connectBot(message);
                                subscription = this._subscriptions.get(message.guild.id);
                                ran++;
                                if ((subscription?.queue.length > this._max_tail && this._max_tail > 0) || !video) return;

                                if (song?.id == video.id || subscription.queue.some((s) => s.id == video.id)) return;
                                const cancion = await this.createSong(message, video.url);

                                subscription.queue.push(cancion);
                                index++;
                            };

                            result.items.forEach((video) => promesas.push(getVideo(video)));

                            Promise.all(promesas)
                                .then(() => {
                                    if (subscription.queue.length > 0) {
                                        const nextSong = subscription.queue.shift()!;
                                        subscription.addedToQueue(nextSong);
                                    }

                                    if (ran >= result.items.length)
                                        if (index == 0) message.reply(this.notaMsg('fail', 'No pude obtener ninguna canción de esa lista de reproducción'));
                                        else if (index == 1) message.channel.send(this.notaMsg('note', '⏭️En cola una canción.'));
                                        else if (index > 1) message.channel.send(this.notaMsg('note', `️⏭️️En cola ${index} canciones.`));
                                })
                                .catch(console.warn);
                        })
                        .catch(() => message.reply(this.notaMsg('fail', 'Algo salió mal al buscar esa lista de reproducción')));
                } else {
                    if (searchstring.includes('https://youtu.be/') || (searchstring.includes('https://www.youtube.com/') && searchstring.includes('&')))
                        searchstring = searchstring.split('&')[0];
                    message.channel.send(this.notaMsg('search', `\`Buscando: ${searchstring}\`...`));

                    this.createSong(message, searchstring)
                        .then(async (song) => {
                            const lastSong = this.getSong(message);
                            if (lastSong?.id == song.id || subscription?.queue.find((c) => c.id == song.id))
                                return message.reply(this.notaMsg('fail', 'Esta canción ya está en la cola.'));

                            this.playSong(message, song);
                        })
                        .catch(() => message.reply(this.notaMsg('fail', 'No se econtró ningún video.')));
                }
            }
        }
    }

    async search(message: Message, search: string): Promise<void> {
        if (!message.guild || !message.member) message.reply(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member.voice.channel) message.reply(this.notaMsg('fail', 'No estas en un canal de voz'));
        else if (!search) message.reply(this.notaMsg('fail', 'No especificaste algo qué buscar'));
        else {
            let subscription = this._subscriptions.get(message.guild.id);
            // if (subscription?.isRadio) this.leave(message);
            if (!subscription && message.guild) subscription = await this.connectBot(message);
            if (this._just_dj && !this.isDj(message.member) && !this.isAdmin(message.member))
                message.reply(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));
            else if (subscription!.queue.length >= this._max_tail && this._max_tail > 0) message.reply(this.notaMsg('fail', 'Tamaño máximo de cola alcanzado!'));
            else {
                const searchstring = search.trim();
                message.channel
                    .send(this.notaMsg('search', `Buscando: \`${searchstring}\``))
                    .then((response) => {
                        this._youtube
                            .searchVideos(searchstring, 10)
                            .then((searchResult) => {
                                if (searchResult.results.length == 0) return response.edit(this.notaMsg('fail', 'Error al obtener resultados de búsqueda.'));

                                const promesas: Promise<void>[] = [];
                                const videos: { id: string; title: string; url: string }[] = [];

                                const getVideo = async (video: Video): Promise<void> => {
                                    videos.push({ id: video.id, title: video.title, url: video.url });
                                };

                                searchResult.results.forEach((video) => promesas.push(getVideo(video)));

                                Promise.all(promesas)
                                    .then(() => {
                                        const process = (firstMsg: Message): void => {
                                            message.channel
                                                .awaitMessages(
                                                    (m: Message) =>
                                                        m.author.id == message.author.id &&
                                                        ((parseInt(m.content) > 0 &&
                                                            parseInt(m.content) <= (searchResult.results.length > 10 ? 10 : searchResult.results.length)) ||
                                                            ['cancel', 'cancelar'].includes(m.content.trim().toLowerCase())),
                                                    {
                                                        max: 1,
                                                        time: 60000,
                                                        errors: ['time']
                                                    }
                                                )
                                                .then((collected) => {
                                                    const collectedArray = collected.first()!;
                                                    const mcon = collectedArray.content.trim().toLowerCase();

                                                    if (['cancel', 'cancelar'].includes(mcon))
                                                        return firstMsg.edit({ content: this.notaMsg('note', 'Búsqueda cancelada.'), embeds: [] });

                                                    firstMsg.delete();

                                                    const cancion = videos[parseInt(mcon) - 1];

                                                    this.createSong(message, cancion.url)
                                                        .then(async (song) => {
                                                            const lastSong = this.getSong(message);
                                                            if (lastSong?.id == song.id || subscription?.queue.find((c) => c.id == song.id))
                                                                return message.reply(this.notaMsg('fail', 'Esta canción ya está en la cola.'));

                                                            this.playSong(message, song);
                                                        })
                                                        .catch(() => message.reply(this.notaMsg('fail', 'No se econtró ningún video.')));
                                                })
                                                .catch(() => firstMsg.edit({ content: '````xl\nBúsqueda cancelada.\n```', embeds: [] }));
                                        };

                                        if (message.channel.type == 'dm' || message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
                                            const embed = new MessageEmbed().setColor(this._embed_color).setTitle('= Elige tu video =');

                                            videos.map((video, index) => embed.addField(`${index + 1}`, `[${this.notaMsg('font', video.title)}](${video.url})`));
                                            if (this._show_name) embed.setFooter(`Buscado por: ${message.author.username}`, message.author.displayAvatarURL());

                                            message.channel.send({ embeds: [embed] }).then((m) => process(m));
                                        } else {
                                            const vids = videos
                                                .map(
                                                    (video, index) =>
                                                        `**${index + 1}:** __${video.title
                                                            .replace(/\\/g, '\\\\')
                                                            .replace(/`/g, '\\`')
                                                            .replace(/\* /g, '\\*')
                                                            .replace(/_/g, '\\_')
                                                            .replace(/~/g, '\\~')
                                                            .replace(/`/g, '\\`')}__`
                                                )
                                                .join('\n\n');
                                            message.channel
                                                .send(`\`\`\`yml\n= Elige tu video =\n\`\`\`${vids}\n\n= Ponga \`cancelar\` o \`cancel\` para cancelar la búsqueda.`)
                                                .then((m) => process(m));
                                        }
                                    })
                                    .catch(console.warn);
                            })
                            .catch(() => response.edit(this.notaMsg('fail', 'Error al obtener resultados de búsqueda.')));
                    })
                    .catch((err: Error) => {
                        throw new Error(`Interno Inesperado: ${err.stack}`);
                    });
            }
        }
    }

    // TODO Incompleto
    radio(message: Message /* , stream?: string */): void {
        if (!message.guild || !message.member) return undefined;

        /* let servidores = this._subscriptions.get(message.guild.id);
        if (message.member && !message.member.voice.channel) message.reply(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (this._just_dj && this.isDj(message.member))
            message.reply(this.notaMsg('fail', 'No tienes permitido reproducír música ya que no cuentas con el rol correspondiente.'));

        if (!servidores)
            servidores = this._guilds
                .set(message.guild!.id, {
                    songs: [],
                    isRadio: true
                })
                .get(message.guild.id)!;
        else {
            servidores.isRadio = true;
            this._guilds.set(message.guild!.id, servidores);
        }

        this.connectBot(message)
            .then(async (connection) => {
                if (stream && stream.length > 1)
                    if (this.isStreamValid(stream)) message.reply(this.notaMsg('fail', 'Link de radio inválido.'));
                    else
                        try {
                            connection.play(stream, {
                                type: 'opus',
                                bitrate: this._bitrate,
                                volume: servidores!.volume / 100
                            });

                            message.channel.send({
                                embeds: [
                                    new MessageEmbed().setColor('RANDOM').setDescription(`:radio: Radio ${message.client.user?.username || 'StarMusic'} Activado~
                        \n🎶◉Escuchando: [.::\`${stream}\`::.]
                        \n📶◉En Línea: [24/7]`)
                                ]
                            });
                        } catch (_) {
                            message.reply(this.notaMsg('fail', 'Link de radio inválido.'));
                        }
                else {
                    connection.play(this._radio_station, {
                        type: 'opus',
                        bitrate: this._bitrate,
                        volume: servidores!.volume / 100
                    });

                    message.channel.send({
                        embeds: [
                            new MessageEmbed().setColor('RANDOM').setDescription(`:radio: Radio ${message.client.user?.username || 'StarMusic'} Activado~
                \n🎶◉Escuchando: [.::\`${this._radio_station}\`::.]
                \n📶◉En Línea: [24/7]`)
                        ]
                    });
                }
            })
            .catch((err) => {
                message.reply(this.notaMsg('fail', 'No se pudo conectar al canal de voz.'));
                console.error(err);
            }); */
    }

    pause(message: Message): void {
        if (!message.guild || !message.member) return;

        const song = this.getSong(message);
        const subscription = this._subscriptions.get(message.guild.id);
        if (!song) message.reply(this.notaMsg('fail', 'No se está reproduciendo música.'));
        // else if (message.guild! && subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (song.autorID != message.author.id && message.member && !this.isAdmin(message.member) && !this._any_pause)
            message.reply(this.notaMsg('fail', 'No tienes permiso de pausar.'));
        else if (subscription.audioPlayer.state.status == AudioPlayerStatus.Paused) message.reply(this.notaMsg('fail', '¡La música ya está en pausa!'));
        else {
            subscription.audioPlayer.pause();
            message.channel.send(this.notaMsg('note', 'Reproducción en pausa.'));
        }
    }

    resume(message: Message): void {
        if (!message.guild || !message.member) return undefined;

        const song = this.getSong(message);
        const subscription = this._subscriptions.get(message.guild.id);
        if (!subscription) message.reply(this.notaMsg('fail', 'No se está reproduciendo música'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (!this._any_pause && song.autorID != message.author.id && !this.isAdmin(message.member))
            message.reply(this.notaMsg('fail', 'No tienes permiso de reanudar.'));
        else if (subscription.audioPlayer.state.status != AudioPlayerStatus.Paused) message.reply(this.notaMsg('fail', 'La música no está páusada.'));
        else {
            subscription.audioPlayer.unpause();
            message.channel.send(this.notaMsg('note', 'Reproducción Reanudada.'));
        }
    }

    skip(message: Message): void {
        if (!message.guild || !message.member) return undefined;

        const subscription = this._subscriptions.get(message.guild.id);
        const song = this.getSong(message);
        if (!song || !subscription) message.reply(this.notaMsg('fail', 'No se está reproduciendo música.'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (subscription.queue.length == 0) message.reply(this.notaMsg('fail', 'No puedes omitir la canción porque no hay una cola de reproducción.'));
        else if (!this._any_skip && song.autorID != message.author.id && !this.isAdmin(message.member))
            message.reply(this.notaMsg('fail', 'No tienes permiso de omitir esta canción.'));
        else if (subscription.loop == 'single') message.reply(this.notaMsg('fail', 'No se puede omitir mientras que el bucle está configurado como `Una canción`'));
        else {
            if (subscription.audioPlayer.state.status == AudioPlayerStatus.Paused) subscription.audioPlayer.unpause();
            subscription.audioPlayer.stop();
            message.channel.send(this.notaMsg('note', 'Canción omitida, espere un momento...'));
        }
    }

    leave(message: Message): void {
        if (!message.guild || !message.member) return undefined;

        const song = this.getSong(message);
        const subscription = this._subscriptions.get(message.guild.id);
        if (this._any_take_out || this.isAdmin(message.member) || song?.autorID == message.author.id)
            if (!subscription) message.reply(this.notaMsg('fail', 'No estoy en un canal de voz.'));
            else {
                subscription.stop();
                subscription.voiceConnection.destroy();
                message.channel.send(this.notaMsg('note', 'Dejé con éxito el canal de voz.'));
            }
        else message.reply(this.notaMsg('fail', 'Me temo que no tienes permiso de sacarme del canal.'));
    }

    np(message: Message): void {
        if (!message.guild || !message.member) return undefined;

        const song = this.getSong(message);
        const subscription = this._subscriptions.get(message.guild.id);
        if (!song) message.reply(this.notaMsg('fail', 'No hay Música sonando.'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else {
            const resMem = message.client.users.cache.get(`${BigInt(song.autorID)}`);
            if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild!.me!)!.has('EMBED_LINKS')) {
                const embed = new MessageEmbed()
                    .setAuthor('🔊Escuchando:')
                    .setColor(this._embed_color)
                    .setThumbnail(`https://i3.ytimg.com/vi/${song.id}/2.jpg`)
                    .setTitle(song.title)
                    .setURL(song.url)
                    .setDescription(
                        `⏭En Cola: \`${subscription.queue.length}\`\nRepetir: \`${
                            !subscription.loop ? 'Desactivado' : subscription.loop == 'single' ? '🔂 Una Canción' : '🔁 Toda la cola de reproducción'
                        }\``
                    )
                    .addField(
                        'Estadísticas',
                        `📅Publicado el: \`${song.datePublished || 'S/D'}\`\n⏲️Duración: \`${song.duration ? ConvertTime(song.duration) : 'S/D'}\`\n👀Vistas: \`${
                            song.views ? ConvertString(song.views) : 'S/D'
                        }\`\n👍Me Gusta: \`${song.likes ? ConvertString(song.likes) : 'S/D'}\`\n👎No Me Gusta: \`${song.dislikes ? ConvertString(song.dislikes) : 'S/D'}\`
                        `
                    );
                if (this._show_name) embed.setFooter(`Solicitado por: ${resMem?.username || `Usuario desconocido (${song.autorID})`}`, 'https://i.imgur.com/WKD5uUL.png');

                message.channel.send({ embeds: [embed] });
            } else {
                let solicitado = '';
                if (this._show_name) solicitado = `| Solicitado por: ${resMem?.tag || `<@${song.autorID}>`}`;

                message.channel.send(
                    `🔊Escuchando: **${song.title}** [Video](${song.url})\n⏭En Cola: \`${subscription.queue.length}\`📅Publicado el: \`${
                        song.datePublished || 'S/D'
                    }\`\n⏲️Duración: \`${song.duration ? ConvertTime(song.duration) : 'S/D'}\`\n👀Vistas: \`${
                        song.views ? ConvertString(song.views) : 'S/D'
                    }\`\n👍Me Gusta: \`${song.likes ? ConvertString(song.likes) : 'S/D'}\`\n👎No Me Gusta: \`${
                        song.dislikes ? ConvertString(song.dislikes) : 'S/D'
                    }\`\n\nPor StarMusic ${solicitado}`
                );
            }
            // this.progressBar(message, song);
        }
    }

    async repeat(message: Message, song?: 0 | 1 | 2 | 3): Promise<void> {
        if (!message.guild || !message.member) return undefined;

        if (song && (song < 0 || song > 3)) message.reply(this.notaMsg('fail', 'Solamente puedes colocar 0, 1, 2 o 3'));

        const subscription = this._subscriptions.get(message.guild.id);
        if (!subscription) message.reply(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (song == 1 || (!song && !subscription.loop)) {
            subscription.setLoop('single');
            message.channel.send(this.notaMsg('note', '¡Repetir una cancíon habilitado! :repeat_one:'));
        } else if (song == 2 || (!song && subscription.loop == 'single')) {
            subscription.setLoop('all');
            message.channel.send(this.notaMsg('note', '¡Repetir Cola habilitada! :repeat:'));
        } else if (song == 0 || song == 3 || (!song && subscription.loop == 'all')) {
            subscription.setLoop();
            message.channel.send(this.notaMsg('note', '¡Repetir canciones deshabilitado! :arrow_forward:'));
        }
    }

    async queue(message: Message, songSearch?: number): Promise<void> {
        if (!message.guild || !message.member) return undefined;

        const subscription = this._subscriptions.get(message.guild.id);

        if (!subscription) message.reply(this.notaMsg('fail', 'No se pudo encontrar una cola para este servidor.'));
        else if (subscription.queue.length == 0) message.reply(this.notaMsg('fail', 'La cola esta vacía.'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else {
            const embed = new MessageEmbed().setColor(this._embed_color);

            if (songSearch) {
                const videoIndex = subscription.queue.findIndex((_, i) => i == songSearch - 1);
                if (videoIndex < 0) message.reply(this.notaMsg('fail', 'No pude encontrar este video.'));
                else {
                    const video = subscription.queue[videoIndex];
                    let resMem = message.client.users.cache.get(`${BigInt(video.autorID)}`);
                    if (!resMem) resMem = await message.client.users.fetch(`${BigInt(video.autorID)}`).catch(() => null);

                    embed
                        .setAuthor('Canción en cola', message.client.user?.displayAvatarURL())
                        .setURL(`https://www.youtube.com/channel/${video.channelID}`)
                        .setDescription(`[${video.title}](${video.url})\nDuración: ${video.duration ? ConvertTime(video.duration) : 'S/D'}`)
                        .addField('En Cola', `${subscription.queue.length}`, true)
                        .addField('Posición', `${videoIndex + 1}`, true)
                        .setThumbnail(`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`);
                    if (this._show_name) embed.setFooter(`Solicitado por: ${resMem?.username || `Usuario Desconocido (${video.autorID})`}`, resMem?.displayAvatarURL());
                    message.channel.send({ embeds: [embed] });
                }
            } else if (subscription.queue.length > 11) {
                const pages: string[] = [];
                let page = 1;
                const newSongs = this.musicArraySort(subscription.queue, 10);
                newSongs.forEach((s, pageI) => {
                    const i = s.map((video, songI) => `**${pageI}${songI + 1}:** __${video.title}__`).join('\n\n');
                    if (i !== undefined) pages.push(i);
                });

                embed
                    .setAuthor('Canciones en cola', message.client.user?.displayAvatarURL())
                    .setFooter(`Página ${page} de ${pages.length}`)
                    .setDescription(pages[page - 1]);
                message.channel.send({ embeds: [embed] }).then(async (m) => {
                    await m.react('⏪');
                    await m.react('⏩');

                    m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id, {
                        time: 120000
                    }).on('collect', () => {
                        if (page === pages.length) return;
                        page++;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit({ embeds: [embed] });
                    });

                    m.createReactionCollector((reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id, {
                        time: 120000
                    }).on('collect', () => {
                        if (page === 1) return;
                        page--;
                        embed.setDescription(pages[page - 1]);
                        embed.setFooter(`Página ${page} de ${pages.length}`, message.author.displayAvatarURL());
                        m.edit({ embeds: [embed] });
                    });
                });
            } else
                message.channel.send({
                    embeds: [
                        embed
                            .setAuthor('Canciones en cola', message.client.user?.displayAvatarURL())
                            .setDescription(subscription.queue.map((video, i) => `**${i + 1}:** __${video.title}__`).join('\n\n'))
                            .setFooter('Página 1 de 1', message.author.displayAvatarURL())
                    ]
                });
        }
    }

    remove(message: Message, song: number): void {
        if (!message.guild || !message.member) return undefined;

        const subscription = this._subscriptions.get(message.guild.id);
        if (!subscription) message.reply(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor.'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (!song) message.reply(this.notaMsg('fail', 'No colocaste la posición del video.'));
        else if (song - 1 == 0) message.reply(this.notaMsg('fail', 'No puedes borrar la música que se está reproduciendo actualmente.'));
        else {
            const cancion = subscription.queue.find((_, i) => i == song - 1);
            if (!cancion) message.reply(this.notaMsg('fail', 'No se pudo encontrar ese video o algo salió mal.'));
            else if (cancion.autorID == message.author.id || this.isDj(message.member) || this.isAdmin(message.member)) {
                subscription.removeQueue(song - 1);
                message.channel.send(this.notaMsg('note', `Eliminado:  \`${cancion.title}\``));
            } else message.reply(this.notaMsg('fail', 'No puedes eliminar esta canción.'));
        }
    }

    clear(message: Message): void {
        if (!message.guild || !message.member) return undefined;

        const subscription = this._subscriptions.get(message.guild.id);
        if (!subscription) message.reply(this.notaMsg('fail', 'No se ha encontrado ninguna cola para este servidor..'));
        // else if (subscription.isRadio) message.reply(this.notaMsg('fail', 'No se puede usar en modo radio.'));
        else if (this._just_dj && !this.isDj(message.member) && !this.isAdmin(message.member))
            message.reply(this.notaMsg('fail', 'Sólo los administradores o personas con rol de DJ pueden borrar la cola de reproducción.'));
        else {
            subscription.removeQueue();

            message.channel.send(this.notaMsg('note', 'Cola borrada.'));
        }
    }
}

export * from './Suscription';
export * from './Song';
export { Music };
