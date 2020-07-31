import Discord from "discord.js";

interface IMusicOpts {
    embedColor?: string;
    youtubeKey: string;
    WeezToken?: string;
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
interface IBot {
    play: (msg: Discord.Message, args: string) => any;
    busqueda: (msg: Discord.Message, args: string) => any;
    radio: (msg: Discord.Message, stream?: any) => any;
    pausa: (msg: Discord.Message) => any;
    reanudar: (msg: Discord.Message) => any;
    omitir: (msg: Discord.Message) => any;
    salir: (msg: Discord.Message) => any;
    np: (msg: Discord.Message) => any;
    repetir: (msg: Discord.Message, args: string) => any;
    cola: (msg: Discord.Message, args: string) => any;
    remover: (msg: Discord.Message, args: string) => any;
    volumen: (msg: Discord.Message, args: number) => any;
    limpiar: (msg: Discord.Message) => any;
}

declare namespace StarMusic {
    interface StarMusicStatic {
        start(client: Discord.Client, options: IMusicOpts): void;
        bot: IBot
    }
}

declare const StarMusic: StarMusic.StarMusicStatic;

export = StarMusic;