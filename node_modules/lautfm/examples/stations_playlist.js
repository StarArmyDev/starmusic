'use strict';

const Lautfm = require('..');

const laut = new Lautfm();

function stationsPLaylist(station)
{
  console.log(`Station: ${station.display_name} - current playlist: ${station.current_playlist.name}`)
}

let params = {
  term: 'eins,radio-l,trancechannel'
}
laut.getStations(params)
  .then((data) => data.forEach(stationsPLaylist))
  .catch(error => console.error(error))
