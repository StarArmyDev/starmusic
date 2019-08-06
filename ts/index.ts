/* ========================================================== */
/*                         StarMusic                          */
/* ========================================================== */
/*                                                            */
/*                      DavichoStar#8104                      */
/*       Servidor de Soporte: https://discord.gg/DsYhNKd      */
/*                                                            */
/* ========================================================== */
import Discord = require('discord.js');
import ytdl = require('ytdl-core');
import ytpl = require('ytpl');
import Lautfm = require('lautfm');
import fetchVideoInfo = require("youtube-info");
import yts = require('ytsearcher');
const YTSearcher = yts.YTSearcher;
const laut = new Lautfm();

interface MusicOpts {
    embedColor?: string;
    youtubeKey: string;
    estacionRadio?: string;
    volumenDef?: number;
    colaMax?: number;
    bitRate?: string;
    emoji?: string;
    adminRol?: Array<string>;
    djRol?: Array<string>;
    soloDj?: boolean;
    cualquieraSaca?: boolean;
    cualquieraPausa?: boolean;
    cualquieraOmite?: boolean;
    mensajeNuevaCancion?: boolean;
    mostrarNombre?: boolean;
}

interface ServerOpts {
    canciones: Array<any>,
    ultima: any,
    repetir: "Ninguna" | "canción" | "todo",
    id: string,
    volumen: number,
    isPlaying: boolean;
}

const conv = (dinero: string) => String(dinero).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

export const start = (client: Discord.Client, options: MusicOpts) => {
    try {
        class Music {
            servidores: Map<string, any>;
            embedColor: string;
            youtubeKey: string;
            estacionRadio: string;
            volumenDef: number;
            colaMax: number;
            bitRate: string;
            emoji: string;
            adminRol: Array<string>;
            djRol: Array<string>;
            soloDj: boolean;
            cualquieraSaca: boolean;
            cualquieraPausa: boolean;
            cualquieraOmite: boolean;
            mensajeNuevaCancion: boolean;
            mostrarNombre: boolean;
            
            searcher: any;
            play!: (msg: any, args: any) => any;
            busqueda!: (msg: any, args: any) => any;
            radio!: (msg: Discord.Message, stream?: any) => any;
            pausa!: (msg: Discord.Message) => any;
            reanudar!: (msg: Discord.Message) => any;
            omitir!: (msg: Discord.Message) => any;
            salir!: (msg: Discord.Message) => any;
            np!: (msg: any) => any;
            repetir!: (msg: Discord.Message, args: any) => any;
            cola!: (msg: Discord.Message, args: any) => any;
            remover!: (msg: Discord.Message, args: any) => any;
            volumen!: (msg: Discord.Message, args: any) => any;
            limpiar!: (msg: Discord.Message) => any;
            
            iniciar!: (msg: Discord.Message, servidores: any) => void;
            buscar_info!: (msg: Discord.Message, res: any, cola?: boolean) => void;
            agregado_a_cola!: (msg: any, res: any) => void;
            mensaje!: (msg: any, res: any) => Promise<void>;
            reproductor!: (msg: any, res: any) => Promise<void>;
            tiempo!: (time: any) => string;
            note!: (type: ('wrap' | 'note' | 'search' | 'fail' | 'font' | 'error'), text: string) => any;

            constructor(options: MusicOpts) {
                // Objecto de Servidores
                this.servidores = new Map();

                this.embedColor = (options && typeof options.embedColor == "string") ? options.embedColor : 'GREEN';
                this.youtubeKey = (options && typeof options.youtubeKey == "string") ? options.youtubeKey : '';
                this.estacionRadio = (options && typeof options.estacionRadio == "string") ? options.estacionRadio : 'http://hd.digitalradio.mx:5883/;';
                this.volumenDef = (options && typeof options.volumenDef == "number") ? options.volumenDef : 50;
                this.colaMax = (options && typeof options.colaMax == 'number') ? options.colaMax : 50;
                this.bitRate = (options && options.bitRate) ? options.bitRate : "auto";
                this.emoji = (options && typeof options.emoji == 'string') ? options.emoji : '🔴';
                this.adminRol = (options && options.adminRol) ? options.adminRol : [''];
                this.djRol = options && options.djRol ? options.djRol : [''];
                this.soloDj = (options && typeof options.soloDj == 'boolean') ? options.soloDj : false;
                this.cualquieraSaca = (options && typeof options.cualquieraSaca == 'boolean') ? options.cualquieraSaca : false;
                this.cualquieraPausa = (options && typeof options.cualquieraPausa == 'boolean') ?options.cualquieraPausa : false;
                this.cualquieraOmite = (options && typeof options.cualquieraPausa == 'boolean') || false;
                this.mensajeNuevaCancion = (options && typeof options.mensajeNuevaCancion ==  'boolean' ? options && options.mensajeNuevaCancion : true);
                this.mostrarNombre = (options && typeof options.mostrarNombre == 'boolean' ? options && options.mostrarNombre : true);
            }

            async updatePositions(obj: any, server: Discord.Guild): Promise<any> {
                return new Promise((resolve, reject) => {
                    if (!obj || typeof obj !== "object") reject();
                    let mm = 0;
                    var newsongs: Array<any> = [];
                    obj.forEach((s: any) => {
                        if (s.position !== mm) s.position = mm;
                        newsongs.push(s);
                        mm++;
                    });
                    this.servidores.get(server.id).ultima.position = 0;
                    resolve(newsongs);
                });
            }

            isAdmin(member: Discord.GuildMember): boolean {
                if (member.id === member.guild.owner.id) return true;
                else if (member.roles.find((r: Discord.Role) => this.adminRol.includes(r.id))) return true;
                else return member.hasPermission("ADMINISTRATOR");
            }

            isDj(member: Discord.GuildMember): boolean {
                if (member.roles.find((r: Discord.Role) => this.djRol.includes(r.id))) return true;
                else return false;
            }

            canSkip(member: Discord.GuildMember, servidores: ServerOpts): boolean {
                if (servidores.ultima.autorID === member.id) return true;
                else if (this.isAdmin(member)) return true;
                else return false;
            }

            canAdjust(member: Discord.GuildMember, servidores: ServerOpts): boolean {
                if (servidores.ultima.autorID === member.id) return true;
                else if (this.isAdmin(member)) return true;
                else return false;
            }

            setLast(server: Discord.Guild, ultima: any) {
                return new Promise((resolve, reject) => {
                    if (this.servidores.has(server.id)) {
                        let q = this.servidores.get(server.id);
                        q.ultima = ultima;
                        this.servidores.set(server.id, q);
                        resolve(this.servidores.get(server.id));
                    }
                    else {
                        reject("Sin cola de servidor");
                    }
                });
            }

            emptyQueue(server: Discord.Guild): Promise<boolean> {
                return new Promise((resolve, reject) => {
                    if (!this.servidores.has(server.id))
                        reject(new Error(`[Cola vacía] no se ha encontrado ninguna cola para ${server.name}`));

                    resolve(this.servidores.delete(server.id));
                });
            }
        }

        if (!client) throw new Error("No proporcionaste al cliente");
        if (!options) throw new Error("No proporcionaste ninguna propiedad, necesitas poner al menos youtubeKey");
        const musicbot: Music = new Music(options);
        exports.bot = musicbot;

        if (musicbot.youtubeKey.length <= 1) throw new Error("No colocaste la propiedad youtubeKey");

        musicbot.searcher = new YTSearcher(musicbot.youtubeKey);

        musicbot.play = (msg: any, args: any) => {
            if (msg.member.voiceChannel === undefined) return msg.channel.send(musicbot.note('fail', `No estas en un canal de voz.`));
            if (!args) return msg.channel.send(musicbot.note('fail', '¡No hay video especificado!'));

            if (!musicbot.servidores.has(msg.guild.id))
                musicbot.servidores.set(msg.guild.id, {
                    canciones: [],
                    ultima: null,
                    repetir: "Ninguna",
                    id: msg.guild.id,
                    volumen: musicbot.volumenDef,
                    isPlaying: false
                });
            if (musicbot.soloDj && musicbot.isDj(msg.member)) return msg.channel.send(musicbot.note('fail', 'No tienes permitido reproducír música.'));

            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            if (servidores.canciones.length >= musicbot.colaMax && musicbot.colaMax !== 0) return msg.channel.send(musicbot.note('fail', 'Tamaño máximo de cola alcanzado'));
            var searchstring = args.trim();

            if (searchstring.startsWith('http') && searchstring.includes("list=")) {
                msg.channel.send(musicbot.note("search", `Buscando elementos de la lista de reproducción~`));
                var playid = searchstring.toString().split('list=')[1];

                if (playid.toString().includes('?'))
                    playid = playid.split('?')[0];
                if (playid.toString().includes('&t='))
                    playid = playid.split('&t=')[0];

                ytpl(playid, function (err, playlist) {
                    if (err)
                        return msg.channel.send(musicbot.note('fail', `Algo salió mal al buscar esa lista de reproducción`));
                    if (playlist.items.length <= 0)
                        return msg.channel.send(musicbot.note('fail', `No se pudo obtener ningún video de esa lista de reproducción.`));
                    if (playlist.total_items >= 50)
                        return msg.channel.send(musicbot.note('fail', `Demasiados videos para poner en cola. Se permite un máximo de 50..`));
                    var index = 0;
                    var ran = 0;

                    playlist.items.forEach(video => {
                        ran++;
                        if (servidores.canciones.length == (musicbot.colaMax + 1) && musicbot.colaMax !== 0 || !video) return;

                        let cancion = {
                            id: video.id,
                            autorID: msg.author.id,
                            position: servidores.canciones.length ? servidores.canciones.length : 0,
                            title: video.title,
                            duracion: video.duration,
                            url: video.url,
                            owner: {
                                name: video.author.name,
                                id: null,
                                image: null
                            }
                        };

                        servidores.canciones.push(cancion);

                        if (servidores.canciones.length === 1)
                            musicbot.iniciar(msg, servidores);
                        index++;

                        if (ran >= playlist.items.length) {
                            if (index == 0) msg.channel.send(musicbot.note('fail', `¡No puedes obtener ninguna canción de esa lista de reproducción!`));
                            else if (index == 1) msg.channel.send(musicbot.note('note', `️️⏭️En cola una canción.`));
                            else if (index > 1) msg.channel.send(musicbot.note('note', `️⏭️️En cola ${index} canciones.`));
                        }
                    });
                });
            } else {
                if (searchstring.includes("https://youtu.be/") || searchstring.includes("https://www.youtube.com/") && searchstring.includes("&")) searchstring = searchstring.split("&")[0];
                msg.channel.send(musicbot.note("search", `\`Buscando: ${searchstring}\`...`));


                new Promise(async (resolve: any, reject: any) => {
                    let result: any = await musicbot.searcher.search(searchstring, { type: 'video' });
                    resolve(result.first);
                }).then((res: any) => {
                    if (!res) return msg.channel.send(musicbot.note("fail", "Algo salió mal. ¡Inténtalo de nuevo!"));

                    let cancion = {
                        id: res.id,
                        autorID: msg.author.id,
                        position: servidores.canciones.length ? servidores.canciones.length : 0
                    };


                    if (servidores.canciones.find((c: any) => c.id == res.id))
                        return msg.reply("Esa canción ya está en cola, espera a que acabe para escucharla otra vez.");
                    else
                        servidores.canciones.push(cancion);

                    if (servidores.canciones.length === 1 || !client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id))
                        musicbot.iniciar(msg, servidores);
                    else
                        musicbot.buscar_info(msg, cancion, true);
                }).catch((res: any) => {
                    console.log(res);
                });
            }
        };

        musicbot.busqueda = (msg: any, args: any) => {
            if (msg.member.voiceChannel === undefined) return msg.channel.send(musicbot.note('fail', `No estas en un canal de voz`));
            if (!args) return msg.channel.send(musicbot.note('fail', 'No especificaste algo qué buscar'));

            if (!musicbot.servidores.has(msg.guild.id))
                musicbot.servidores.set(msg.guild.id, {
                    canciones: [],
                    ultima: null,
                    repetir: "Ninguna",
                    id: msg.guild.id,
                    volumen: musicbot.volumenDef,
                    isPlaying: false
                });
            if (musicbot.soloDj && musicbot.isDj(msg.member)) return msg.channel.send(musicbot.note('fail', 'No tienes permitido reproducír música.'));

            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            if (servidores.canciones.length >= musicbot.colaMax && musicbot.colaMax !== 0) return msg.channel.send(musicbot.note('fail', 'Tamaño máximo de cola alcanzado!'));

            let searchstring = args.trim();
            msg.channel.send(musicbot.note('search', `Buscando: \`${searchstring}\``)).then((response: any) => {
                musicbot.searcher.search(searchstring, {
                    type: 'video'
                }).then((searchResult: any) => {
                    if (!searchResult.totalResults || searchResult.totalResults === 0) return response.edit(musicbot.note('fail', 'Error al obtener resultados de búsqueda.'));

                    const startTheFun = async (videos: any, max: any) => {
                        if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                            const embed: Discord.RichEmbed = new Discord.RichEmbed();
                            embed.setTitle(`Elige tu video`);
                            embed.setColor(musicbot.embedColor);
                            var index = 0;
                            videos.forEach(function (video: any) {
                                index++;
                                embed.addField(`${index} (${video.channelTitle})`, `[${musicbot.note('font', video.title)}](${video.url})`, true);
                            });
                            if (musicbot.mostrarNombre) embed.setFooter(`Buscado por: ${msg.author.username}`, msg.author.displayAvatarURL);

                            msg.channel.send({ embed: embed }).then((firstMsg: any) => {
                                const filter = (m: any) => {
                                    let contents: Array<any> = [];
                                    for (let i = 0; i < max; i++) {
                                        contents.push(m.content.includes(i + 1));
                                    }
                                    return m.author.id === msg.author.id && (contents) || m.content.trim() === (`cancel`) || m.content.trim() === (`cancelar`);
                                };
                                setTimeout(() => {
                                    msg.channel.awaitMessages(filter, {
                                        max: 1,
                                        time: 60000,
                                        errors: ['time']
                                    }).then((collected: any) => {
                                        const newColl: Array<any> = Array.from(collected);
                                        const mcon = newColl[0][1].content;

                                        if (mcon === "cancel" || mcon === "cancelar") return firstMsg.edit(musicbot.note('note', 'Búsqueda cancelada.'));

                                        const song_number: number = parseInt(mcon) - 1;
                                        if (song_number >= 0)
                                        {
                                            firstMsg.delete();

                                            let cancion = {
                                                id: videos[song_number].id,
                                                autorID: msg.author.id,
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

                                            if (servidores.canciones.length === 1 || !client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id))
                                                musicbot.iniciar(msg, servidores);
                                            else
                                                musicbot.buscar_info(msg, cancion, true);
                                        }
                                    }).catch((collected: any) => {
                                        if (collected.toString().match(/error|Error|TypeError|RangeError|Uncaught/)) return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                        return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada.\n\`\`\``);
                                    });
                                }, 500);
                            });
                        } else {
                            const vids = videos.map((video: any, index: any) => (
                                `**${index + 1}:** __${video.title.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/~/g, '\\~').replace(/`/g, '\\`')}__`
                            )).join('\n\n');
                            msg.channel.send(`\`\`\`\n= Elige tu video =\n${vids}\n\n= Ponga \`cancelar\` o \`cancel\` para cancelar la búsqueda.`).then((firstMsg: any) => {
                                const filter = (m: any) => {
                                    let contents: Array<any> = [];
                                    for (let i = 0; i < max; i++) {
                                        contents.push(m.content.includes(i + 1));
                                    }
                                    return m.author.id === msg.author.id && (contents) || m.content.trim() === (`cancel`) || m.content.trim() === (`cancelar`);
                                };
                                msg.channel.awaitMessages(filter, {
                                    max: 1,
                                    time: 60000,
                                    errors: ['time']
                                }).then((collected: any) => {
                                    const newColl: Array<any> = Array.from(collected);
                                    const mcon = newColl[0][1].content;

                                    if (mcon === "cancel" || mcon === "cancelar") return firstMsg.edit(musicbot.note('note', 'Búsqueda cancelada.'));
                                    const song_number = parseInt(mcon) - 1;
                                    if (song_number >= 0) {
                                        firstMsg.delete();

                                        let cancion = {
                                            id: videos[song_number].id,
                                            autorID: msg.author.id,
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
                                        if (servidores.canciones.length === 1 || !client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id))
                                            musicbot.iniciar(msg, servidores);
                                        else
                                            musicbot.buscar_info(msg, cancion, true);
                                    }
                                }).catch((collected: any) => {
                                    if (collected.toString()
                                        .match(/error|Error|TypeError|RangeError|Uncaught/)) return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada. ${collected}\n\`\`\``);
                                    return firstMsg.edit(`\`\`\`xl\nBúsqueda cancelada.\n\`\`\``);
                                });
                            });
                        }
                    };

                    const max = searchResult.totalResults >= 10 ? 9 : searchResult.totalResults - 1;
                    var videos: Array<any> = [];
                    for (var i = 0; i < 99; i++) {
                        var result = searchResult.currentPage[i];
                        result.autorID = msg.author.id;
                        videos.push(result);
                        if (i === max) {
                            i = 101;
                            startTheFun(videos, max);
                        }
                    }
                });
            })
                .catch(console.log);
        };

        musicbot.radio = (msg: Discord.Message, stream: any = false) => {
            if (msg.member.voiceChannel === undefined) return msg.channel.send(musicbot.note('fail', `No estas en un canal de voz.`));

            if (!musicbot.servidores.has(msg.guild.id))
                musicbot.servidores.set(msg.guild.id, {
                    canciones: [],
                    ultima: null,
                    repetir: "Ninguna",
                    id: msg.guild.id,
                    volumen: musicbot.volumenDef,
                    isPlaying: false
                });

            if (musicbot.soloDj && musicbot.isDj(msg.member)) return msg.channel.send(musicbot.note('fail', 'No tienes permitido reproducír música.'));

            new Promise((resolve, reject) => {
                let voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection === null) {
                    if (msg.member.voiceChannel && msg.member.voiceChannel.joinable) {
                        msg.member.voiceChannel.join().then((connection: Discord.VoiceConnection) => {
                            resolve(connection);
                        }).catch((error: Error) => {
                            console.error(error);
                        });
                    }
                    else if (!msg.member.voiceChannel.joinable || msg.member.voiceChannel.full) {
                        msg.channel.send(musicbot.note('fail', '¡No tengo permiso para unirme a tu canal de voz!'));
                        reject();
                    }
                    else
                        reject();
                }
                else
                    resolve(voiceConnection);
            }).then(async (connection: any) => {
                if (stream) {
                    let estadoServer = await laut.getServerStatus();
                    if (!estadoServer || !estadoServer.running) return msg.channel.send(`Servidor de Radio No disponible: \`${estadoServer.message}\``);

                    stream = await laut.searchStations({ query: stream, limit: 1 }).catch((err: Error) => console.error(err));
                    let rdio = stream.results[0].items[0].station;

                    connection.playStream(rdio.stream_url, {
                        bitrate: musicbot.bitRate,
                        volume: (musicbot.servidores.get(msg.guild.id).volumen / 100)
                    });
                    let horaR = new Date(rdio.updated_at);

                    const embed: Discord.RichEmbed = new Discord.RichEmbed()
                        .setColor(rdio.color.length > 1 ? rdio.color : rdio.curren_playlist.color.length > 1 ? rdio.curren_playlist.color : "RANDOM")
                        .setThumbnail(rdio.images.station)
                        .setDescription(`:radio: Radio ${client.user.username} Activado~
              \n🎶◉Estación: [.::\`${rdio.display_name}\`::.]
              \nDescripción: \`${rdio.description}\`
              \nDj's: ${rdio.djs.length > 1 ? rdio.djs : "Sin Dj's"} | Lugar: ${rdio.location.length > 1 ? rdio.location : "Desconocido"}
              \n▶PlayList en Reproducción: ${rdio.current_playlist.name}
              \n🕐Fecha de la Emisora: ${horaR} | 🕥Termina: ${rdio.current_playlist.end_time}:00 hrs
              \n▶PlayList que Sigue: ${rdio.next_playlist.name}
              \n🕐Empieza: ${rdio.next_playlist.hour}:00 hrs | 🕥Termina: ${rdio.next_playlist.end_time}:00 hrs
              \n📶◉En Línea: [24/7]`);
                    msg.channel.send({ embed: embed });
                }
                else {
                    connection.playStream(musicbot.radio, {
                        bitrate: musicbot.bitRate,
                        volume: (musicbot.servidores.get(msg.guild.id).volumen / 100)
                    });
                    const embed: Discord.RichEmbed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .setDescription(`:radio: Radio ${client.user.username} Activado~
              \n🎶◉Escuchando: [.::\`${musicbot.radio}\`::.]
              \n📶◉En Línea: [24/7]`);
                    msg.channel.send({ embed: embed });
                }
            });
        };

        musicbot.pausa = (msg: Discord.Message) => {
            const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No se está reproduciendo música.'));
            let authorC = musicbot.servidores.get(msg.guild.id).ultima;
            if (authorC.autorID !== msg.author.id || (!musicbot.isAdmin(msg.member) && !musicbot.cualquieraPausa)) return msg.channel.send(musicbot.note('fail', 'No tienes permiso de pausar.'));

            const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
            if (dispatcher.paused)
                return msg.channel.send(musicbot.note(`fail`, `¡La música ya está en pausa!`));
            else
                dispatcher.pause();
            msg.channel.send(musicbot.note('note', 'Reproducción en pausa.'));
        };

        musicbot.reanudar = (msg: Discord.Message) => {
            const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No se está reproduciendo música'));
            let authorC = musicbot.servidores.get(msg.guild.id).ultima;
            if (authorC.autorID !== msg.author.id || (!musicbot.isAdmin(msg.member) && !musicbot.cualquieraPausa)) return msg.channel.send(musicbot.note('fail', `No tienes permiso de reanudar.`));

            const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
            if (!dispatcher.paused) return msg.channel.send(musicbot.note('fail', `La música no está páusada.`));
            else dispatcher.resume();
            msg.channel.send(musicbot.note('note', 'Reproducción Reanudada.'));
        };

        musicbot.omitir = (msg: Discord.Message) => {
            const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            let authorC = musicbot.servidores.get(msg.guild.id).ultima;

            if (voiceConnection === null)
                return msg.channel.send(musicbot.note('fail', 'No se está reproduciendo música.'));
            if (!musicbot.canSkip(msg.member, servidores))
                return msg.channel.send(musicbot.note('fail', `No puedes saltear esto porque no hay una cola de reproducción.`));
            if (authorC.autorID !== msg.author.id || (!musicbot.isAdmin(msg.member) && !musicbot.cualquieraOmite))
                return msg.channel.send(musicbot.note('fail', 'No tienes permiso de omitir.'));
            if (musicbot.servidores.get(msg.guild.id).repetir == "canción")
                return msg.channel.send(musicbot.note("fail", "No se puede omitir mientras que el bucle está configurado como simple."));

            const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
            if (!dispatcher || dispatcher === null)
                return msg.channel.send(musicbot.note("fail", "Algo salió mal corriendo y saltando."));
            if (dispatcher.paused) dispatcher.end();
            dispatcher.end();
            msg.channel.send(musicbot.note("note", "Canción omitida."));
        };

        musicbot.salir = (msg: Discord.Message) => {
            let authorC = musicbot.servidores.get(msg.guild.id).ultima;
            if (authorC.autorID == msg.author.id || musicbot.cualquieraSaca || musicbot.isAdmin(msg.member))
            {
                const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection === null)
                    return msg.channel.send(musicbot.note('fail', 'No estoy en un canal de voz.'));
                musicbot.emptyQueue(msg.guild);

                if (!voiceConnection.player.dispatcher) return;
                voiceConnection.player.dispatcher.end();
                voiceConnection.disconnect();
                msg.channel.send(musicbot.note('note', 'Dejé con éxito el canal de voz.'));
            }
            else
                msg.channel.send(musicbot.note('fail', `Me temo que no puedo dejar que hagas eso, ${msg.author.username}.`));
        };

        musicbot.np = (msg: any) => {
            const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No hay Música sonando.'));

            if (servidores.canciones.length <= 0) return msg.channel.send(musicbot.note('note', 'Cola vacía.'));

            if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                try {
                    const embed: Discord.RichEmbed = new Discord.RichEmbed()
                        .setAuthor(client.user.username, client.user.displayAvatarURL)
                        .setColor(musicbot.embedColor)
                        .setThumbnail(servidores.ultima.owner.image)
                        .setImage(`https://i3.ytimg.com/vi/${servidores.ultima.id}/2.jpg`)
                        .setColor(musicbot.embedColor)
                        .addField("🔊Escuchando:", `[${servidores.ultima.title}](${servidores.ultima.url}) por: 👤[${servidores.ultima.owner.name}](https://www.youtube.com/channel/${servidores.ultima.owner.id})`, true)
                        .addField("⏭En Cola", servidores.canciones.length, true);
                    const resMem = client.users.get(servidores.ultima.autorID);
                    if (musicbot.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL);
                    if (musicbot.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${servidores.ultima.autorID})\``);

                    msg.channel.send({ embed: embed });
                } catch (e) {
                    console.error(`[${msg.guild.name}] [npCmd] ` + e.stack);
                }
            }
            else {
                try {
                    let solicitado = "";
                    const resMem = client.users.get(servidores.ultima.autorID);
                    if (musicbot.mostrarNombre && resMem) solicitado = `Solicitado por: ${resMem.username}`;
                    if (musicbot.mostrarNombre && !resMem) solicitado = `Solicitado por: \`Usuario desconocido (ID: ${servidores.ultima.autorID})\``;

                    msg.channel.send(`🔊Escuchando: **${servidores.ultima.title}**
          \npor: 👤[${servidores.ultima.owner.name}](https://www.youtube.com/channel/${servidores.ultima.owner.id})
          \n${solicitado}
          \n⏭En Cola: ${servidores.canciones.length}`);
                } catch (e) {
                    console.error(`[${msg.guild.name}] [npCmd] ` + e.stack);
                }
            }
            musicbot.reproductor(msg, servidores.ultima);
        };

        musicbot.repetir = (msg: Discord.Message, args: any) => {
            if (!musicbot.servidores.has(msg.guild.id))
                return msg.channel.send(musicbot.note('fail', `No se ha encontrado ninguna cola para este servidor!`));

            if (parseInt(args) == 1 || (!args && musicbot.servidores.get(msg.guild.id).repetir == "Ninguna"))
            {
                musicbot.servidores.get(msg.guild.id).repetir = "canción";
                msg.channel.send(musicbot.note('note', '¡Repetir una cancíon habilitado! :repeat_one:'));
            }
            else if (parseInt(args) == 2 || (!args && musicbot.servidores.get(msg.guild.id).repetir == "canción"))
            {
                musicbot.servidores.get(msg.guild.id).repetir = "todo";
                msg.channel.send(musicbot.note('note', '¡Repetir Cola habilitada! :repeat:'));
            }
            else if ((parseInt(args) == 0 || parseInt(args) == 3) || (!args && musicbot.servidores.get(msg.guild.id).repetir == "todo"))
            {
                musicbot.servidores.get(msg.guild.id).repetir = "Ninguna";
                msg.channel.send(musicbot.note('note', '¡Repetir canciones deshabilitado! :arrow_forward:'));
                const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
                let wasPaused: boolean = dispatcher.paused;
                if (wasPaused) dispatcher.pause();
                let newq = musicbot.servidores.get(msg.guild.id).canciones.slice(musicbot.servidores.get(msg.guild.id).ultima.position - 1);
                if (newq !== musicbot.servidores.get(msg.guild.id).canciones)
                    musicbot.updatePositions(newq, msg.guild)
                        .then((res: any) => musicbot.servidores.get(msg.guild.id).canciones = res);
                if (wasPaused) dispatcher.resume();
            }
        };

        musicbot.cola = (msg: Discord.Message, args: any) => {
            if (!musicbot.servidores.has(msg.guild.id))
                return msg.channel.send(musicbot.note("fail", "No se pudo encontrar una cola para este servidor."));
            else if (musicbot.servidores.get(msg.guild.id).canciones.length <= 0)
                return msg.channel.send(musicbot.note("fail", "La cola esta vacía."));
            const servidores = musicbot.servidores.get(msg.guild.id);

            const embed: Discord.RichEmbed = new Discord.RichEmbed()
                .setColor(musicbot.embedColor);

            if (args) {
                let video = servidores.canciones.find((s: any) => s.position == parseInt(args) - 1);
                if (!video) return msg.channel.send(musicbot.note("fail", "No pude encontrar ese video."));
                embed.setAuthor('Canción en cola', client.user.avatarURL)
                    .setTitle(video.owner.name)
                    .setURL(`https://www.youtube.com/channel/${video.owner.id}`)
                    .setDescription(`[${video.title}](${video.url})\nDuración: ${typeof video.duracion == "number" ? musicbot.tiempo(video.duracion) : video.duracion}`)
                    .addField("En Cola", servidores.canciones.length, true)
                    .addField("Posición", video.position + 1, true)
                    .setThumbnail(`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`);
                const resMem = client.users.get(video.autorID);
                if (musicbot.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL);
                if (musicbot.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${video.autorID})\``);
                msg.channel.send({ embed });
            }
            else {
                if (servidores.canciones.length > 11) {
                    let pages: Array<any> = [];
                    let page = 1;
                    const newSongs = servidores.canciones.musicArraySort(10);
                    newSongs.forEach((s: any) => {
                        var i = s.map((video: any, index: any) => (
                            `**${video.position + 1}:** __${video.title}__`
                        )).join('\n\n');
                        if (i !== undefined) pages.push(i);
                    });

                    embed.setAuthor('Canciones en cola', client.user.avatarURL)
                        .setFooter(`Página ${page} de ${pages.length}`)
                        .setDescription(pages[page - 1]);
                    msg.channel.send({ embed: embed }).then(async (m: any) => {

                        await m.react('⏪');
                        await m.react('⏩');

                        let siguienteFilter = m.createReactionCollector((reaction: Discord.MessageReaction, user: Discord.User) => reaction.emoji.name === '⏩' && user.id === msg.author.id, { time: 120000 });
                        let regresarFilter = m.createReactionCollector((reaction: Discord.MessageReaction, user: Discord.User) => reaction.emoji.name === '⏪' && user.id === msg.author.id, { time: 120000 });

                        siguienteFilter.on('collect', (r: any) => {
                            if (page === pages.length) return;
                            page++;
                            embed.setDescription(pages[page - 1]);
                            embed.setFooter(`Página ${page} de ${pages.length}`, msg.author.displayAvatarURL);
                            m.edit({ embed: embed });
                        });
                        regresarFilter.on('collect', (r: any) => {
                            if (page === 1) return;
                            page--;
                            embed.setDescription(pages[page - 1]);
                            embed.setFooter(`Página ${page} de ${pages.length}`, msg.author.displayAvatarURL);
                            m.edit({ embed: embed });
                        });
                    });
                } else {
                    var nuevasC = musicbot.servidores.get(msg.guild.id).canciones.map((video: any, index: any) => (
                        `**${video.position + 1}:** __${video.title}__`)
                    ).join('\n\n');

                    embed.setAuthor('Canciones en cola', client.user.avatarURL)
                        .setDescription(nuevasC)
                        .setFooter(`Página 1 de 1`, msg.author.displayAvatarURL);
                    return msg.channel.send({ embed: embed });
                }
            }
        };

        musicbot.remover = (msg: Discord.Message, args: any) => {
            if (!musicbot.servidores.has(msg.guild.id)) return msg.channel.send(musicbot.note('fail', `No se ha encontrado ninguna cola para este servidor.`));
            if (!args) return msg.channel.send(musicbot.note("fail", "No colocaste la posición del video."));

            if (parseInt(args) - 1 == 0) return msg.channel.send(musicbot.note("fail", "No puedes borrar la música que se está reproduciendo actualmente."));
            let cancionR = musicbot.servidores.get(msg.guild.id).canciones.find((x: any) => x.position == parseInt(args) - 1);

            if (cancionR) {
                if (cancionR.autorID !== msg.author.id || !musicbot.isAdmin(msg.member)) return msg.channel.send(musicbot.note("fail", "No puedes eliminar esta canción."));
                let newq = musicbot.servidores.get(msg.guild.id).canciones.filter((s: any) => s !== cancionR);
                musicbot.updatePositions(newq, msg.guild).then((res: any) => {
                    musicbot.servidores.get(msg.guild.id).canciones = res;
                    msg.channel.send(musicbot.note("note", `Eliminado:  \`${cancionR.title}\``));
                });
            }
            else
                msg.channel.send(musicbot.note("fail", "No se pudo encontrar ese video o algo salió mal."));
        };

        musicbot.volumen = (msg: Discord.Message, args: any) => {
            const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No se reproduce música.'));
            if (!musicbot.canAdjust(msg.member, musicbot.servidores.get(msg.guild.id))) return msg.channel.send(musicbot.note('fail', `Sólo los administradores o DJ's pueden cambiar el volumen.`));
            const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;

            if (!args || isNaN(args)) return msg.channel.send(musicbot.note('fail', 'Sin volumen especificado.'));
            args = parseInt(args);
            if (args > 200 || args <= 0) return msg.channel.send(musicbot.note('fail', 'Volumen fuera de rango, debe estar dentro de 1 a 200'));

            dispatcher.setVolume((args / 100));
            musicbot.servidores.get(msg.guild.id).volumen = args;
            msg.channel.send(musicbot.note('note', `Volumen cambiado a ${args}%.`));
        };

        musicbot.limpiar = (msg: Discord.Message) => {
            if (!musicbot.servidores.has(msg.guild.id)) return msg.channel.send(musicbot.note("fail", "No se ha encontrado ninguna cola para este servidor.."));
            if (!musicbot.isDj(msg.member) || !musicbot.isAdmin(msg.member)) return msg.channel.send(musicbot.note("fail", `Sólo los administradores o personas con el ${musicbot.djRol} puede borrar colas.`));
            let emptyQueue: Promise<boolean> = musicbot.emptyQueue(msg.guild);
            if (emptyQueue)  {
                msg.channel.send(musicbot.note("note", "Cola borrada."));
                const voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection !== null)
                {
                    const dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
                    if (!dispatcher || dispatcher === null) {
                        console.log(new Error(`dispatcher nulo en saltar cmd [${msg.guild.name}] [${msg.author.username}]`));
                        return msg.channel.send(musicbot.note("fail", "Algo salió mal."));
                    }
                    if (dispatcher.paused)
                        dispatcher.end();
                    dispatcher.end();
                }
            }
            else
            {
                console.error(new Error(`[clearCmd] [${msg.guild.id}] ${emptyQueue}`));
                return msg.channel.send(musicbot.note("fail", "Algo salió mal limpiando la cola."));
            }
        };

        // ===============[ Función Principal ]=============== //
        musicbot.iniciar = (msg: Discord.Message, servidores: any) => {
            if (servidores.canciones.length <= 0)
            {
                msg.channel.send(musicbot.note('note', 'Reproducción Terminada~'));
                let voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection !== null) return voiceConnection.disconnect();
                musicbot.servidores.delete(msg.guild.id);
            }

            new Promise((resolve: any, reject: any) => {
                let voiceConnection: Discord.VoiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection === null)
                {
                    if (msg.member.voiceChannel && msg.member.voiceChannel.joinable)
                    {
                        msg.member.voiceChannel.join().then((connection: Discord.VoiceConnection) => {
                            connection.setMaxListeners(0);
                            resolve(connection);
                        }).catch((error: Error) => {
                            throw new Error(`[StarMusic] [Conexión] error: ${error}`);
                        });
                    }
                    else if (!msg.member.voiceChannel.joinable || msg.member.voiceChannel.full)
                    {
                        msg.channel.send(musicbot.note('fail', '¡No tengo permiso para unirme a tu canal de voz!'));
                        reject();
                    }
                    else
                        musicbot.emptyQueue(msg.guild).then(() => {
                            reject();
                        });
                }
                else
                    resolve(voiceConnection);
            })
            .then(async (connection: any) => {
                
                let video: any;
                if (!servidores.ultima)
                {
                    video = servidores.canciones[0];
                    musicbot.buscar_info(msg, video);
                }
                else
                {
                    if (servidores.repetir == "todo")
                    {
                        video = servidores.canciones.find((s: any) => s.position == servidores.ultima.position + 1);
                        if (!video || video && !video.id) video = servidores.canciones[0];
                    }
                    else if (servidores.repetir == "single")
                        video = servidores.ultima;
                    else
                        video = servidores.canciones.find((s: any) => s.position == servidores.ultima.position);
                }

                if (!video)
                {
                    video = musicbot.servidores.get(msg.guild.id).canciones ? musicbot.servidores.get(msg.guild.id).canciones[0] : false;
                    if (!video)
                    {
                        msg.channel.send(musicbot.note('note', 'Reproducción Terminada'));
                        musicbot.emptyQueue(msg.guild);
                        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                        if (voiceConnection !== null) return voiceConnection.disconnect();
                    }
                }

                if (musicbot.mensajeNuevaCancion == true && servidores.ultima && musicbot.servidores.get(msg.guild.id).repetir !== "canción")
                    musicbot.buscar_info(msg, video);
                try {
                    musicbot.setLast(msg.guild, video);
                    let dispatcher: Discord.StreamDispatcher = connection.playStream(ytdl(`https://www.youtube.com/watch?v=${video.id}`, {
                        filter: 'audioonly'
                    }), {
                            bitrate: musicbot.bitRate,
                            volume: (musicbot.servidores.get(msg.guild.id).volumen / 100)
                        });

                    connection.on('error', (error: Error) => {
                        console.error(error);
                        if (msg && msg.channel) msg.channel.send(musicbot.note('fail', `Algo salió mal con la conexión. Volviendo a intentar cola ...`));
                        musicbot.iniciar(msg, musicbot.servidores.get(msg.guild.id));
                    });

                    dispatcher.on('error', (error: Error) => {
                        console.error(error);
                        if (msg && msg.channel) msg.channel.send(musicbot.note('fail', `Algo salió mal al tocar música. Volviendo a intentar cola ...`));
                        musicbot.iniciar(msg, musicbot.servidores.get(msg.guild.id));
                    });

                    dispatcher.on('end', () => {
                        setTimeout(() => {
                            if (!musicbot.servidores.get(msg.guild.id)) return;
                            let seRepite = musicbot.servidores.get(msg.guild.id).repetir;
                            if (musicbot.servidores.get(msg.guild.id).canciones.length > 0) {
                                if (seRepite == "Ninguna" || seRepite == null) {
                                    musicbot.servidores.get(msg.guild.id).canciones.shift();
                                    musicbot.updatePositions(musicbot.servidores.get(msg.guild.id).canciones, msg.guild).then((res: any) => {
                                        musicbot.servidores.get(msg.guild.id).canciones = res;
                                        musicbot.iniciar(msg, musicbot.servidores.get(msg.guild.id));
                                    }).catch((err: Error) => { console.error("Algo salió mal moviendo la cola: ", err); });
                                }
                                else if (seRepite == "todo" || seRepite == "canción") {
                                    musicbot.iniciar(msg, musicbot.servidores.get(msg.guild.id));
                                }
                            }
                            else if (musicbot.servidores.get(msg.guild.id).canciones.length <= 0) {
                                msg.channel.send(musicbot.note('note', 'Reproducción Terminada.'));
                                musicbot.servidores.delete(msg.guild.id);
                                const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                                if (voiceConnection !== null) return voiceConnection.disconnect();
                            }
                        }, 1250);
                    });
                } catch (error) {
                    throw new Error(`[StarMusic] [Conexión] error: ${error}`);
                }
            })
            .catch((error: Error) => {
                throw new Error(`[StarMusic] [Conexión] error: ${error}`);
            });
        };

        // ===============[ Funciones Internas ]=============== //
        musicbot.buscar_info = (msg: Discord.Message, res: any, cola: boolean = false) => {
            fetchVideoInfo(res.id, async function (err: any, videoInfo: any) {
                if (err) return console.error(err);

                res.title = videoInfo.title;
                res.duracion = conv(`${parseInt(videoInfo.duration) - 1}`);
                res.fecha = videoInfo.datePublished;
                res.genero = videoInfo.genre;
                res.vistas = conv(videoInfo.views);
                res.likes = conv(videoInfo.likeCount);
                res.dislikes = conv(videoInfo.dislikeCount);
                res.url = videoInfo.url;
                res.owner = {
                    name: videoInfo.owner,
                    id: videoInfo.channelId != undefined ? videoInfo.channelId : videoInfo.owner,
                    image: videoInfo.channelThumbnailUrl.startsWith("//") ? videoInfo.channelThumbnailUrl.replace("//", 'https://') : videoInfo.channelThumbnailUrl
                };

                if (cola)
                    musicbot.agregado_a_cola(msg, res);
                else
                    musicbot.mensaje(msg, res);
            });
        };

        musicbot.agregado_a_cola = (msg: any, res: any) => {
            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            const resMem = client.users.get(res.autorID);

            if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                try {
                    const embed: Discord.RichEmbed = new Discord.RichEmbed()
                        .setAuthor('⏭️Agregando a la cola', client.user.avatarURL)
                        .setColor(musicbot.embedColor)
                        .setThumbnail(`https://i3.ytimg.com/vi/${res.id}/2.jpg`)
                        .addField("Agregado a Cola:", `[${res.title}](${res.url}) por: [${res.owner.name}](https://www.youtube.com/channel/${res.owner.id})`)
                        .addField("En cola", servidores.canciones.length, true)
                        .addField("Estadísticas", `📅Publicado el: ${res.fecha}\n⏲️Duración: ${res.duracion}`);
                    if (musicbot.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL);
                    if (musicbot.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${res.autorID})\``);

                    msg.channel.send({ embed: embed });
                } catch (e) {
                    console.error(`[${msg.guild.name}] [agrColaCmd] ` + e.stack);
                }
            }
            else {
                try {

                    let solicitado = "";
                    if (musicbot.mostrarNombre && resMem) solicitado = `Solicitado por: ${resMem.username}`;
                    if (musicbot.mostrarNombre && !resMem) solicitado = `Solicitado por: \`Usuario desconocido (ID: ${res.autorID})\``;

                    msg.channel.send(`
            ⏭️Agregado a cola: **${res.title}**
            \n${solicitado}
            \nEn cola: ${servidores.canciones.length}
            📅Publicado el: ${res.fecha}
            \n⏲️Duración: ${res.duracion}
          `);
                } catch (e) {
                    console.error(`[${msg.guild.name}] [agrColaElseCmd] ` + e.stack);
                }
            }
        };

        musicbot.mensaje = async (msg: any, res: any) => {
            const servidores: ServerOpts = musicbot.servidores.get(msg.guild.id);
            const resMem = client.users.get(res.autorID);

            if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                try {
                    const embed: Discord.RichEmbed = new Discord.RichEmbed()
                        .setAuthor(client.user.username, client.user.displayAvatarURL)
                        .setColor(musicbot.embedColor)
                        .setThumbnail(res.owner.image)
                        .setImage(`https://i3.ytimg.com/vi/${res.id}/2.jpg`)
                        .addField("🔊Escuchando:", `[${res.title}](${res.url}) por: 👤[${res.owner.name}](https://www.youtube.com/channel/${res.owner.id})`)
                        .addField("⏭En cola", servidores.canciones.length, true)
                        .addField("Estadísticas", `📅Publicado el: ${res.fecha}\nGénero: ${res.genero}\n👥Vistas: ${res.vistas}\n👍Me Gusta: ${res.likes}\n👎No Me Gusta: ${res.dislikes}`);
                    if (musicbot.mostrarNombre && resMem) embed.setFooter(`Solicitado por: ${resMem.username}`, resMem.displayAvatarURL);
                    if (musicbot.mostrarNombre && !resMem) embed.setFooter(`Solicitado por: \`Usuario desconocido (ID: ${res.autorID})\``);

                    msg.channel.send({ embed: embed });
                } catch (e) {
                    console.error(`[${msg.guild.name}] [mensajeCmd] ` + e.stack);
                }
            }
            else {
                try {

                    let solicitado = "";
                    if (musicbot.mostrarNombre && resMem) solicitado = `Solicitado por: ${resMem.username}`;
                    if (musicbot.mostrarNombre && !resMem) solicitado = `Solicitado por: \`Usuario desconocido (ID: ${res.autorID})\``;

                    msg.channel.send(`
            🔊Escuchando ahora: **${res.title}**
            \n${solicitado}
            \n⏭En cola: ${servidores.canciones.length}
          `);
                } catch (e) {
                    console.error(`[${msg.guild.name}] [mensajeElseCmd] ` + e.stack);
                }
            }
            musicbot.reproductor(msg, res);
        };

        musicbot.reproductor = async (msg: any, res: any) => {
            const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            let dispatcher: Discord.StreamDispatcher = voiceConnection.player.dispatcher;
            if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                let embed = new Discord.RichEmbed()
                    .setColor(musicbot.embedColor)
                    .addField(`Reproducción Actual: 0:0 :⏲: 0:0`, musicbot.emoji + "────────────────────────────── [0%]");
                msg.channel.send({ embed: embed }).then((m: any) => {
                    let tiempoM: any = setInterval(() => {
                        let embedTimer: Discord.RichEmbed = new Discord.RichEmbed()
                            .setColor(musicbot.embedColor);
                        let duracionD = dispatcher ? dispatcher.time : false;

                        if (!duracionD) return clearInterval(tiempoM);
                        else dispatcher.on('end', () => clearInterval(tiempoM));


                        if (res.duracion) {
                            let porcentaje = duracionD * 100 / (res.duracion * 1000);
                            porcentaje = Math.trunc(porcentaje);
                            let l = "─";
                            let por = porcentaje * 30 / 100;
                            por = Math.trunc(por);

                            let progreso = `${l.repeat(por)}${musicbot.emoji}${l.repeat(30 - por)} [${porcentaje}%]`;
                            embedTimer.addField(`Reproducción Actual: ${musicbot.tiempo(duracionD / 1000)} :⏲: ${musicbot.tiempo(res.duracion)}`, progreso);
                        }
                        else
                            embedTimer.addField("Reproducción Actual:", musicbot.tiempo(duracionD / 1000) + " ⏲");


                        m.edit({ embed: embedTimer});

                    }, 2000);

                });
            }
            else {
                msg.channel.send(`Reproducción Actual: 0:0 :⏲: 0:0
          \n\n${musicbot.emoji}────────────────────────────── [0%]`).then((m: any) => {
              let tiempoM: any = setInterval(() => {
                        let duracionD = dispatcher ? dispatcher.time : false;

                        if (!duracionD) return clearInterval(tiempoM);
                        else dispatcher.on('end', () => clearInterval(tiempoM));

                        let texto: string;

                        if (res.duracion) {
                            let porcentaje = duracionD * 100 / (res.duracion * 1000);
                            porcentaje = Math.trunc(porcentaje);
                            let l = "─";//68
                            let por = porcentaje * 30 / 100;
                            por = Math.trunc(por);

                            let progreso = `${l.repeat(por)}${musicbot.emoji}${l.repeat(30 - por)} [${porcentaje}%]`;
                            texto = `Reproducción Actual: ${musicbot.tiempo(duracionD / 1000)} :⏲: ${musicbot.tiempo(res.duracion)}\n\n${progreso}`;
                        }
                        else
                            texto = "Reproducción Actual:" + musicbot.tiempo(duracionD / 1000) + " ⏲";


                        m.edit(texto);

                    }, 2000);

                });
            }
        };

        musicbot.tiempo = (time: number) => {
            var hrs = ~~(time / 3600);
            var mins = ~~((time % 3600) / 60);
            var secs = ~~time % 60;
            var ret = "";
            if (hrs > 0)
                ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
            ret += "" + mins + ":" + (secs < 10 ? "0" : "");
            ret += "" + secs;
            return ret;
        };

        musicbot.note = (type: ('wrap' | 'note' | 'search' | 'fail' | 'font' | 'error'), text: string) => {
            if (type === 'wrap') {
                let ntext = text
                    .replace(/`/g, '`' + String.fromCharCode(8203))
                    .replace(/@/g, '@' + String.fromCharCode(8203))
                    .replace(client.token, 'ELIMINADO');
                return '```\n' + ntext + '\n```';
            }
            else if (type === 'note')
                return ':musical_note: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
            else if (type === 'search')
                return ':mag: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
            else if (type === 'fail')
                return ':no_entry_sign: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
            else if (type === 'font')
            {
                return text.replace(/`/g, '`' + String.fromCharCode(8203))
                    .replace(/@/g, '@' + String.fromCharCode(8203))
                    .replace(/\\/g, '\\\\')
                    .replace(/\*/g, '\\*')
                    .replace(/_/g, '\\_')
                    .replace(/~/g, '\\~')
                    .replace(/`/g, '\\`');
            }
            else if (type == 'error')
                console.error(new Error(`[ERROR]: ${text}`));
            else
                console.error(new Error(`${type} es un tipo inválido`));
        };

        Object.defineProperty(Array.prototype, 'musicArraySort', {
            value: function (n: any) {
                return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
            }
        });

    } catch (e) {
        throw new Error(`[ERROR] [StarMusic] Ocurrió un problema inesperado Error: ${e}`);
    }
};
