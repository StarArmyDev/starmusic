Módulo Fácil de imprementar para tu bot de Discord con el cual podrás crear Bots de música con respuestas en español para la librería de discord.js y tener incluso radio.

## Cambios
v1.0.1
* Se inició el proyecto con su respectiva guía básica.

## Instalación:
__Pre-Instalción__
Para que tu bot pueda ejecutar música necesita lo siguiente:
1. `npm install discord.js` esencial para iniciar tu proyecto, se recomienda tener la versión estable.

2. `ffmpeg` Instale la versíon correspondiente para su Sistema Operativo. Permite al bot unir a voz y poder hablar.

3. `npm install node-opus` o `npm install opusscript` Es el motor de audio que permite a discord.js usar y manejar el audio.

__Instalación__
```shell
npm install starmusic
```

## Funciones:
* [play](#play)
* [busqueda](#busqueda)
* [radio](#radio)
* [pausa](#pausa)
* [reanudar](#reanudar)
* [omitir](#omitir)
* [salir](#salir)
* [np](#np)
* [repetir](#repetir)
* [cola](#cola)
* [remover](#remover)
* [volumen](#volumen)
* [limpiar](#limpiar)

## Configuraciones:
* [Tabla](#opciones)

## Requiriendo el paquete
Es recomendable colocarlo en su variable cliente.
```js
client.music = require('starmusic');
```
Aunque siéntete libre de colocarlo en una variable.
```js
const music = require('starmusic');
```

## Inicializar
En su archivo principal del bot, `index.js` o `server.js` comúnmente, debe de iniciar el módulo antes de ser utilizado.
```js
client.music.start(client, {
    youtubeKey: 'Tu YouTube Data API3 key'
});
```
`.start()` recibe dos parámetros **client** que corresponde a tu variable del bot, **{opciones}** los cuales puedes revisar en esta tabla [aquí](#opciones)

## Usando las Funciones

<a name="play" />
# Play

```js
play(msg, args)
```
Reproduce música dando un texto a buscar o un link de youtube, ya sea una canción o una lista el link. Cuando empieza la canción se mostrara su información y el reproductor.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args: será la cadena de texto que se tiene que buscar o un link de youtube.

<a name="busqueda" />
# Busqueda

```js
busqueda(msg, args)
```
Búsca una canción y selecciona una de las 10 opciones para reproducir la música. *(Tienen que escribir del 1 al 10 después de usar el comando para elegir la canción)*

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args: será la cadena de texto que se tiene que buscar.

<a name="radio" />
# Radio

```js
radio(msg, args)
```
Reproduce una estación de radio configurada en las **{opciones}** o el usuario puede dar un mensaje para buscar una estación.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args *(opcional)*: será la cadena de texto con la cuál se va a buscar una estación de radio.

<a name="pausa" />
# Pausa

```js
pausa(msg)
```
Detiene la reproducción actual.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.

<a name="reanuda" />
# Reanuda

```js
reanuda(msg)
```
Continúa con la reproducción en donde la dejaste.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.

<a name="omitir" />
# Omitir

```js
omitir(msg)
```
Sálta la canción actual, si no hay otra canción el bot finalizará la reproducción.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.

<a name="salir" />
# Salir

```js
salir(msg)
```
Termina la reproduccion actual y salca al bot de el canal.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.

<a name="np" />
# Np

```js
np(msg)
```
Te dice lo que está sonando en ese momento y abre el reproductor nuevamente.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.

<a name="cola" />
# Cola de Reproducción

```js
cola(msg, args)
```
Te muestra las canciones que tienes por reproducir y la actual. Si colocas un número representando la posisión de la canción en cola, te da información hacerca de esta.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args *(opcional)*: número correspondiente a la posision de una canción.

<a name="remover" />
# Remover

```js
remover(msg, args)
```
Quita una canción en especifico de la cola de reproducción.

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args: número correspondiente a la posision de la canción a quitar.

<a name="volumen" />
# Volumen

```js
volumen(msg, args)
```
Establece el volumen de la música entre 0 a 200 con que la música sonará independiente del volumen del bot en discord. *(se puede establecer el volumen por defecto en {opciones})*

__Argumentos__
1. msg: Corresponde a la variable `message` de tu evento `messages`.
2. args: número válido entre 0 a 200.

<a name="limpiar" />
# Limpirar Cola

```js
limpiar(msg)
```
Quitará todas las canciones de la  cola de reproducción menos la que esté sonando actualmente.

### Tabla de Opciones
<a name="opciones" />
Opciones y Configuraciones

| Opción | Tipo | Descripción | Por Defecto | 
| --- | --- | --- | --- |
| youtubekey | String | Key de YouTube Data API3 que puedes obtener desde [Google Cloud](https://developers.google.com/youtube/v3/getting-started) | NaN
| embedColor | String | Color que se le dará a los embeds en hexadesimal o colores reservados de discord.js | GREEN
| volumenDef | Number | Volumen por defecto con el cual iniciarán todas las canciones de 1 a 200 | 50
| emoji | String | Establece el emoji que se mostrará en el reproductor | 🔴
| estacionRadio | String | Link de la estación de radio por defecto para el bot | http://hd.digitalradio.mx:5883/;
| colaMax | Number | Establece el límite de la cola que se permite | 50
| bitRate | String | Establece el bitRate que discord.js usa y permite | auto
| adminRol | Array | ID de los roles con poder en los comandos como sacar al bot o omitir canciones sin ser quien puso la canción | NaN
| djRol | Array | ID de los roles que pueden usar los comandos si `soloDj` es true | NaN
| soloDj | Boolean | si es true, solamente los que tendan cierto rol podrán ocupar los comandos | False
| cualquieraSaca | Boolean | si es true, cualquiera podrá usar el comando de salir, si es false, solamente quien puso la canción y admins podrán hacerlo | False
| cualquieraPausa | Boolean | si es true, cualquiera podrá usar el comando de pausar, si es false, solamente quien puso la canción y admins podrán hacerlo | False
| cualquieraOmite | Boolean | si es true, cualquiera podrá usar el comando de omitir, si es false, solamente quien puso la canción y admins podrán hacerlo | False
| mensajeNuevaCancion | Boolean | si es true, saldrá un mensaje cuando termine una cancion y empiece una nueva con la información de la misma, si es false, no saldrá ningun mensaje | True
| mostrarNombre | Boolean | si es true, mostrará el nombre en el embed de quien solicitó la canción | True

## Ejemplo
```js
//Declaramos nuestro módulos base
const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";
//Asignamos nuestro módulo a client
client.music = require('starmusic');

client.on('ready', () => console.log('Encendido'));

client.on('messages', (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith(prefix + "play"))
    {
        let args = message.content.slice(prefix.length + 4); //Aquí medimos nuestro prefix y sumamos 4 por el largo de "play"
        client.music.play(message, args.join(' '));
    }
});

//Aquí iniciamos el módulo, pero puedes iniciarlo donde quieras
client.music.start(client, {
    youtubeKey: 'TuApiKey',
    adminRol: ['IDRol'],
    volumenDef: 100
    //Puedes poner las opciones que necesites
});

client.login('token');

```
Tambien puedes colocarloen una variable normal

```js
//Declaramos nuestro módulos base
const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";
//Asignamos nuestro módulo a client
const music = require('starmusic');

client.on('ready', () => console.log('Encendido'));

music.start(client, {
    youtubeKey: 'TuApiKey'
});

client.on('messages', (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith(prefix + "play"))
    {
        let args = message.content.slice(prefix.length + 4);
        music.play(message, args.join(' '));
    }
});

client.login('token');

```

## Soporte
Si necesitas ayuda puedes entrar en el servidor de Soporte de StarBot: https://discord.gg/MZN8Yf6