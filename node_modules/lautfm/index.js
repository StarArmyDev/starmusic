'use strict'

const queryClient = require('./lib/queryclient');

const PARAM_NAMES = {
    query: 'string',
    limit: 'number',
    offset: 'number',
    lat: 'string',
    lng: 'string'
};

const STATION_SECTIONS = Object.freeze([
    'current_song',
    'last_song',
    'schedule',
    'playlists',
    'listeners',
    'next_artist'
]);

const STATIONS_BY = Object.freeze([
    'live',
    'letter',
    'genre',
    'numbers'
]);

const BASE_PATH = '/';

const REQUEST_OPTIONS = {
    host: 'api.laut.fm'
}


const extractParams = (filter={}) => {
    let params = {}
    Object.keys(PARAM_NAMES).forEach(function(name) {
        if (typeof filter[name] !== 'undefined') {
            params[name] = filter[name]
        }
    })
    return params
}

/**
 * convert searchresult to array. remove additional infos.
 *
 * @param {object} data
 * @returns {array}
 */
const getStationslist = (data) => {
  let list = [],
    names = [];

    data.results.forEach(function(sub) {
      sub.items.forEach(function(item) {
        if (names.indexOf(item.station.name) === -1) {
          list.push(item.station);
          names.push(item.station.name);
        }
      });
  });

  return list;
}


class Lautfm {

  constructor(options={})
  {
    this._options = Object.assign({}, REQUEST_OPTIONS);
    if (options.protocol) {
      this._options.protocol = options.protocol;
    }
  }

    /**
     *
     * @param {string} route
     * @param {object} params
     */
    _queryApi(route, params)
    {
        let options = Object.assign({}, this._options, {path: BASE_PATH + route});
        return queryClient(options, params);
    }

    /**
     * Search stations (http://api.laut.fm/documentation/search)
     * usage searchStation(params[, list])
     * param.query is mandatory
     *
     * @param {object} params  {query: <string>, limit: <integer>, offset: <integer>, lat: <string>, lng: <string>}
     * @param {boolean} list if set to true searchresult will be a flat list of station-objects.
     * @returns {promise}
     */
    searchStations(params, list=false)
    {
        return this._queryApi('search/stations', params)
            .then((data) => list===true ? getStationslist(data) : data);
    }

    /**
     * Get Station details by name.
     * if section is set the result will only contain the section.
     *
     * Usage: getStation(<name>[, section])
     *
     * @param {string} name mandatory
     * @param {string} section [current_song|last_song|schedule|playlists|listeners|next_artist]
     * @returns {promise}
     */
    getStation(name, section)
    {
        let route = 'station/' + encodeURI(name)
        if (section) {
            route += '/' + section
        }
        return this._queryApi(route)
    }

    /**
     * get a list of stations
     *
     * @example
     * let filter = {
     *  by: 'genre'  // filter by genere. 'by' can be [live|letter|genre|numbers]
     *  term: 'jazz' // by genre jazz. {genre}, {letter}, {comma_separated_station_names}
     *  limit: 10    // max 10 stations.  not by=live or term={comma_separated_station_names}
     * }
     *
     * @param {object} filter {by: <string>, term: <string>, offset: <integer>, limit: <integer>, lat: <string>, lng: <string>}
     * @returns {promise}
     */
    getStations(filter={})
    {
      let route = 'stations',
        params = extractParams(filter)

      if (filter.by && filter.by !== 'name') {
        route += '/' + encodeURI(filter.by)
      }
      if (filter.term) {
        route += '/' + encodeURI(filter.term)
      }
      return this._queryApi(route, params)
    }

    /**
     * The server time
     *
     * @returns {promise}
     */
    getServerTime()
    {
      return this._queryApi('time');
    }

    /**
     * The current server status and a message.
     *
     * @returns {promise}
     */
    getServerStatus()
    {
      return this._queryApi('server_status');
    }

    /**
     * All available genres
     *
     * @param {boolean} list if set to true result will be a array of genrenames. default is false
     * @returns {promise}
     */
    getGenres(list)
    {
      return this._queryApi('genres').then(
        (data) => list !== true ? data :
          data.map((g) => g.name).sort((a, b) => a.localeCompare(b, 'de'))
      );
    }

    /**
     * All available starting-letters of the stations.
     *
     * @returns {promise}
     */
    getLetters()
    {
      return this._queryApi('letters');
    }

    /**
     * The names of all stations.
     *
     * @returns {promise}
     */
    getStationNames()
    {
      return this._queryApi('station_names');
    }

    /**
     * The listeners of all stations.
     *
     * @returns {promise}
     */
    getListeners()
    {
      return this._queryApi('listeners');
    }

    /**
     * The image sizes are 240x100, 220x220 and 720x300 pixels
     *
     * @returns {promise}
     */
    getTeaser()
    {
      return this._queryApi('teaser');
    }

    get station_sections()
    {
      return STATION_SECTIONS;
    }

    get stations_by()
    {
      return STATIONS_BY;
    }
}

module.exports = Lautfm;
