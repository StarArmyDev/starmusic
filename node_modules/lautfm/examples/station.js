'use strict';

const Lautfm = require('..');
const laut = new Lautfm();

function stationInfo(station)
{
  // show display-name
  console.log(`Station: ${station.display_name}`)

  // get the current song
  const data = laut.getStation(station.name, 'current_song')
    // show title and artist
    .then(data => console.log(`Current song: ${data.title} by ${data.artist.name} `))
}

// get radiostation 'eins'
laut.getStation('eins')
  .then(stationInfo)
  .catch(error => console.error(error))
