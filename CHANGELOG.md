# Cambios

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v3.0.0] - 2021-00-00

## Added

- Soporte para ser usado en slash commands y pasar un `CommandInteraction` en vez de `Message` de las funciones.
- Se exportan más propiedades que el StarMusic constructor por defecto para dar más libertad a los desarrolladores avanzados de crear más funcionalidades.

### Fixed

- Con el cambio de dependencias y la re-codificación de la mayoría del código, se notará una mejora significativa en estabilidad y rendimiento.

### Changed

- **[BREAKING]** Cambio de versión de discord.js a v13
- Mejoras en el aspecto visual de los mensajes enviados quitando y poniendo información necesaria en cada uno.

### Removed

- **[BREAKING]** Se eliminó la función `volume` para mejorar el rendimiento del bot evitando dicho proceso.
- Reproductor removido por el momento.

## [v2.0.1] - 2021-03-04

### Fixed

- Corrección en el tiempo cuando se agrega una canción a la cola.
- Corrección en las imagenes y ejemplos del readme.

## [v2.0.0] - 2021-02-22

## Added

- Se agregó documentación, tipos y ayudas en las funciones y variables para intregrarce bien con Typescript.
- Se agregó generación automática de documentación para tenerla en html. Se debe de mejorar aún.

### Changed

- Se cambió todo el código colocando en inglés todas las variables para mayor familiaridad.
- Se cambió de exportar una función a exportar una clase.
- Se cambió el nombre de todas las funciones públicas:
  - busqueda -> `search`
  - pausa -> `pause`
  - reanudar -> `resume`
  - omitir -> `skip`
  - salir -> `leave`
  - repetir -> `repeat`
  - cola -> `queue`
  - remover -> `remove`
  - volumen -> `volume`
  - limpiar -> `clear`
- Se cambió el nombre de algunas opciones:
  - volumenDef -> `volumeDefault`
  - colaMax -> `maxTail`
  - bitRate -> `bitrate`
  - adminRol -> `adminRoles`
  - djRol -> `djRoles`
  - soloDj -> `justDj`
  - cualquieraSaca -> `anyTakeOut`
  - cualquieraPausa -> `anyPause`
  - cualquieraOmite -> `anySkip`
  - mensajeNuevaCancion -> `newSongMessage`
  - mostrarNombre -> `showName`.

### Removed

- Ya no se nececita pasar el client cuando se inicializa el módulo.

## [v1.0.2] - 2019-08-15

### Added

- Se agregaron funciones internas para mejorar la aparienia de texto con valores numéricos grandes y valores de tiempo.
- Se agregó un ejemplo en el readme.

### Fixed

- Corrección en el readme.

## [v1.0.1] - 2019-08-06

### Added

- Se agregó el readme como guía básica.
- Se agregó el .gitignore

### Changed

- Se cambiaron nombres de todas las funciones (Se pasaron al español).
- Se cambiaron nombres de funciones internas.

## v1.0.0 - 2019-08-06

- Versión inicial.

[unreleased]: https://github.com/StarArmyDev/starmusic/compare/v3.0.0...HEAD
[v1.0.1]: https://github.com/StarArmyDev/starmusic/compare/v1.0.0...v1.0.1
[v1.0.2]: https://github.com/StarArmyDev/starmusic/compare/v1.0.1...v1.0.2
[v2.0.0]: https://github.com/StarArmyDev/starmusic/compare/v1.0.2...v2.0.0
[v2.0.1]: https://github.com/StarArmyDev/starmusic/compare/v2.0.0...v2.0.1
[v3.0.0]: https://github.com/StarArmyDev/starmusic/compare/v2.0.1...v3.0.0
