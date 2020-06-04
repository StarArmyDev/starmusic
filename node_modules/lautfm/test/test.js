'use strict';

const {expect} = require('chai')
const LautFM = require('../index')

const Lautfm = new LautFM()

describe('#Lautfm', function() {
    var stationNames = [];

    it('should return server stat', function() {
        return Lautfm.getServerStatus().then(function(data) {
            expect(data).to.contain.keys('running','message');
        });
    });

    it('should return stations with listener', function() {
        return Lautfm.getListeners().then(function(data) {
            stationNames = Object.keys(data);
            expect(stationNames.length).to.be.above(0)
        });
    });

    it('should return all station names', function() {
        return Lautfm.getStationNames().then(function(data) {
            expect(data.length).to.be.gt(0)
        })
    })

    it('should return a search result', function() {
        let params = {
            query: 'ska',
            limit: 2
        };
        return Lautfm.searchStations(params).then(function(data) {
            expect(data.total).to.be.gte(2)
        });
    });

    it('should return one station', function() {
        let start = stationNames.length/2,
            name = stationNames.slice(start, start+1).shift();
        return Lautfm.getStation(name).then(function(data) {
            expect(data.name).to.be.equal(name)
        });
    });
});
