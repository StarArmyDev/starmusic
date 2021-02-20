"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytpl_1 = __importDefault(require("ytpl"));
const Music_1 = __importDefault(require("./Music"));
class StarMusic extends Music_1.default {
    play(message, search) {
        if (!message.guild)
            message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else if (!message.member.voice.channel)
            message.channel.send(this.notaMsg('fail', 'No estas en un canal de voz.'));
        else if (!search)
            message.channel.send(this.notaMsg('fail', '¡No has colocado nada que buscar!'));
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
                                position: servidores?.songs.length || 0,
                                title: video.title,
                                url: video.url,
                                channelId: video.author.channelID,
                                duration: video.durationSec
                            };
                            servidores.songs.push(cancion);
                            if (servidores?.songs.length === 1)
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
                        .searchVideos(searchstring, 1)
                        .then((result) => {
                        if (result.results.length === 0)
                            return message.channel.send(this.notaMsg('fail', 'No se econtró ningún video.'));
                        const cancion = {
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
                        if (servidores.songs.find((c) => c.id == cancion.id))
                            return message.reply('Esa canción ya está en cola, espera a que acabe para escucharla otra vez.');
                        else
                            servidores.songs.push(cancion);
                        if (servidores.songs.length === 1 || !message.client.voice?.connections.find((val) => val.channel.guild.id == message.guild.id))
                            this.playSong(message, servidores);
                        else
                            this.addedToQueue(message, cancion);
                    })
                        .catch((err) => {
                        message.channel.send(this.notaMsg('fail', 'Algo salio mal'));
                        throw new Error(`[StarMusic] Error Interno Inesperado: ${err.stack}`);
                    });
                }
            }
        }
    }
    leave(message) {
        if (!message.guild || !message.member)
            message.channel.send(this.notaMsg('fail', 'No estas en un servidor.'));
        else {
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
    }
}
exports.default = StarMusic;
