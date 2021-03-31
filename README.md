<div align="center">

<img src="./media/logo.png" height="180">

[![Versión de NPM](https://img.shields.io/npm/v/starmusic?maxAge=3600)](https://www.npmjs.com/package/starmusic)
[![Descargas de NPM](https://img.shields.io/npm/dt/starmusic?maxAge=3600)](https://www.npmjs.com/package/starmusic) [![Estado ESLint](https://github.com/StarArmyDev/starmusic/workflows/ESLint/badge.svg)](https://github.com/StarArmyDev/starmusic/actions?query=workflow%3A%22ESLint%22) [![Vulnerabilidades Conocidas](https://snyk.io/test/github/StarArmyDev/starmusic/badge.svg)](https://snyk.io/test/github/StarArmyDev/starmusic?targetFile=package.json) [![DeepScan grade](https://deepscan.io/api/teams/12942/projects/16035/branches/333292/badge/grade.svg)](https://deepscan.io/dashboard/#view=project&tid=12942&pid=16035&bid=333292) [![time tracker](https://wakatime.com/badge/github/StarArmyDev/starmusic.svg)](https://wakatime.com/badge/github/StarArmyDev/starmusic) [![Chat de Discord](https://discordapp.com/api/guilds/491819854307917826/widget.png?style=shield)](https://discord.gg/VG6D4ss)

[![npm installnfo](https://nodei.co/npm/starmusic.png?downloads=true&stars=true "npm installnfo")](https://nodei.co/npm/starmusic/)

[![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)](https://forthebadge.com)

</div>

Módulo fácil de implementar para tu bot de Discord con el cual podrás crear bots de música en español enfocada para discord.js.

Para ver los cambios recientes, no olvides leer el documento [CHANGELOG.md](./CHANGELOG.md)

## Instalación

```shell
npm install --save starmusic
```

## Funciones

- [play](#play)
- [search](#search)
- [pause](#pause)
- [resume](#resume)
- [skip](#skip)
- [leave](#leave)
- [np](#np)
- [repeat](#repeat)
- [queue](#queue)
- [remove](#remove)
- [volume](#volume)
- [clear](#clear)

## Configuraciones

- [Tabla](#opciones)
- [Ejemplos](#ejemplos)

## Requiriendo el paquete

Modo convencional

```js
const StarMusic = require('starmusic');
```

Usando EC6

```ts
import StarMusic from 'starmusic';
```

## Inicializar

En su archivo principal del bot, `index.js` o `server.js` comúnmente, debe de iniciar el módulo antes de ser utilizado.

```js
var music = new StarMusic({
    youtubeKey: 'Tu YouTube Data API3 key'
});
```

El constructor recibe **{opciones}** los cuales puedes revisar en esta [tabla](#opciones)

# Play

```js
play(message, search);
```

Reproduce música dando un texto a buscar o un link de youtube, ya sea una canción o una lista el link. Cuando empieza la canción se mostrara su información y el reproductor.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.
2. search: Será la cadena de texto que se tiene que buscar o un link de youtube.

# Search

```js
search(message, search);
```

Búsca una canción y selecciona una de las 10 opciones para reproducir la música. _(Tienen que escribir del 1 al 10 después de usar el comando para elegir la canción)_

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.
2. search: Será la cadena de texto que se tiene que buscar.

# Pause

```js
pause(message);
```

Pausa la reproducción actual.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

# Resume

```js
resume(message);
```

Continúa con la reproducción previamente pausada.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

# skip

```js
skip(message);
```

Salta la canción actual, si no hay otra canción el bot finalizará la reproducción.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

# Leave

```js
leave(message);
```

Termina la reproduccion actual y salca al bot de el canal.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

# Np

```js
np(message);
```

Te dice lo que está sonando en ese momento y abre el reproductor nuevamente.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

# Repeat

```js
repeat(message, song);
```

Establece el modo de repetición de la cola de reproducción actual.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.
2. song _(opcional)_: Modo en número. Si no pasa esta propiedad el modo se establecerá al siguiente de la lista.

Modos:

- 1: Modo repetir una canción.
- 2: Repetir todas las canciones.
- 0 | 3: Desactivar modo repetir.

# Queue

```js
queue(message, song);
```

Te muestra las canciones que tienes por reproducir y la actual. Si colocas un número representando la posisión de la canción en cola, te da información hacerca de esta.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages`.
2. song _(opcional)_: Número correspondiente a la posision de una canción.

# Remove

```js
remove(message, song);
```

Quita una canción en especifico de la cola de reproducción.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.
2. song: Número correspondiente a la posision de la canción a quitar.

# Volume

```js
volume(message, volume);
```

Establece el volumen de la música entre 0 a 200 con que la música sonará independiente del volumen del bot en discord. _(se puede establecer el volumen por defecto en {opciones})_

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.
2. volume: Número válido entre 0 a 200.

# Clear

```js
clear(message);
```

Quitará todas las canciones de la cola de reproducción menos la que esté sonando actualmente.

- **Argumentos**

1. message: Corresponde a la variable `message` de tu evento `messages` de Discord.

## Opciones

Tabla de opciones y configuraciones

| Opción         | Tipo    | Descripción                                                                                                                                        | Por Defecto |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| youtubekey     | String  | Key de YouTube Data API3 que puedes obtener desde [Google Cloud](https://developers.google.com/youtube/v3/getting-started)                         | Ninguno     |
| embedColor     | String  | Color que se le dará a los embeds en hexadesimal o colores reservados de discord.js                                                                | RED         |
| volumeDefault  | Number  | Volumen por defecto con el cual iniciarán todas las canciones de 1 a 200                                                                           | 50          |
| emoji          | String  | Establece el emoji que se mostrará en el reproductor                                                                                               | 🔴          |
| maxTail        | Number  | Establece el límite de la cola que se permite                                                                                                      | 50          |
| bitrate        | String  | Establece el bitRate que discord.js usa y permite                                                                                                  | auto        |
| adminRoles     | Array   | ID de los roles con poder en los comandos como sacar al bot o omitir canciones sin ser quien puso la canción                                       | Ninguno     |
| djRoles        | Array   | ID de los roles que pueden usar los comandos si `soloDj` es true                                                                                   | Ninguno     |
| justDj         | Boolean | si es true, solamente los que tendan cierto rol podrán ocupar los comandos                                                                         | False       |
| anyTakeOut     | Boolean | si es true, cualquiera podrá usar el comando de salir, si es false, solamente quien puso la canción y admins podrán hacerlo                        | False       |
| anyPause       | Boolean | si es true, cualquiera podrá usar el comando de pausar, si es false, solamente quien puso la canción y admins podrán hacerlo                       | False       |
| anySkip        | Boolean | si es true, cualquiera podrá usar el comando de omitir, si es false, solamente quien puso la canción y admins podrán hacerlo                       | False       |
| newSongMessage | Boolean | si es true, saldrá un mensaje cuando termine una cancion y empiece una nueva con la información de la misma, si es false, no saldrá ningun mensaje | True        |
| showName       | Boolean | si es true, mostrará el nombre en el embed de quien solicitó la canción                                                                            | True        |

## Ejemplos

### Usando un archivo (Nivel básico)

En nuestro archivo principal. Comunmente llamado `index.js`.

```js
// Declaramos la base
const Discord = require('discord.js');
const StarMusic = require('starmusic');

const prefix = '!';
const client = new Discord.Client();

// Aquí iniciamos el módulo.
var music = new StarMusic({
    youtubeKey: 'ApiKey',
    adminRoles: ['IDRol'],
    volumenDefault: 100
    // Puedes poner las opciones que necesites.
});

// Evento para ver cuando el bot ya prendió y está funcionando.
client.on('ready', () => console.log('¡Encendido!'));

client.on('messages', (message) => {
    // No hacemos nada si el usuario es un bot o el mensaje no empieza con el prefijo.
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    if (message.content.startsWith(prefix + 'play')) {
        let args = message.content.slice(prefix.length + 4); // Aquí medimos nuestro prefix y sumamos 4 por el largo de la palabra "play"
        music.play(message, args.join(' '));
    }
});

client.login('SecretToken');
```

### Usando Command handling (Nivel medio)

En nuestro archivo principal. Comunmente llamado `index.js`.

```js
// Declaramos la base
const Discord = require('discord.js');
const StarMusic = require('starmusic');
const fs = require('fs');

const prefix = '!';
const client = new Discord.Client();
client.commands = new Discord.Collection();

// Aquí iniciamos el módulo y lo pasaremos por el cliente.
client.music = new StarMusic({
    youtubeKey: 'ApiKey',
    djRoles: ['IDRol', 'IDRol2'],
    embedColor: 'BLUE'
});

// Leemos la carpeta commands donde se encuentran nuestros archivos de comandos.
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

// Hacemos un for para leer los archivos escaneados previamente.
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    /* Establecer un nuevo comando en la colección.
     * Ponemos como clave el nombre de comando y como valor el módulo exportado.
     */
    client.commands.set(command.name, command);
}

// Nuestros eventos comunes...
client.on('ready', () => console.log('¡Encendido!'));

client.on('messages', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command == 'play') {
        // Obtenemos nuestro comando y ejecutamos su función execute.
        client.commands.get('play').execute(client, message, args);
    }
});

client.login('SecretToken');
```

En la misma carpeta del bot, cree una nueva carpeta y asígnele un nombre como `commands`. Después crea un nuevo archivo llamado `play.js` copia y pega el siguiente código:

```js
module.exports = {
    name: 'play',
    description: 'Reproduce una canción',
    execute(client, message, args) {
        client.music.play(message, args.join(' '));
    }
};
```

Puedes ver una guía completa de ¿Cómo hacer manejo de comandos? en [esta guía](https://discordjs.guide/command-handling/ 'Discord.js') _(En inglés)_

## Soporte

<div align="center">

[![StarArmy](https://discordapp.com/api/guilds/491819854307917826/widget.png?style=banner3)](https://discord.gg/MZN8Yf6)

</div>
