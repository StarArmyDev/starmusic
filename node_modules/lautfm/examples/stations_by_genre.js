'use strict';

const Lautfm = require('..');

const laut = new Lautfm();

function stationsPLaylist(station)
{
  console.log(`Station: ${station.display_name} - Genres: ${station.genres}`)
}

let params = {
  by: 'genre',
  term: 'Jazz',
  limit: 5
}
laut.getStations(params)
  .then((data) => data.forEach(stationsPLaylist))
  .catch(error => console.error(error))
