const chalk = require('chalk');
const keys = require('../config/keys');

const async_log = require('debug')('async: http');
async_log.enabled = true;
const log = require('debug')('sync: sync');
log.enabled = true;

const googleMapsClient = require('@google/maps').createClient({
    key: keys.googlemaps,
    Promise: Promise
});

function processRawJSON(data){
    try {
        log('processing raw JSON');
        const { formatted_address: addr } = data;
        const { lat, lng } = data.geometry.location;

        return {
            addr: addr,
            lat: lat,
            lng: lng
        }
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError processing Google Maps Geocode returned JSON\n'));
        console.log(chalk.red(err.stack));
    }
}

async function fetchOne(address){
    try {
        async_log(`Fetch ${chalk.green(address)} from Google API`);
        const res = await googleMapsClient.geocode({ address: address }).asPromise();

        if(!res) {
            return null;
        } else {
            return res.json.results[0];
        }
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError fetching address from Google Geocode API\n'));
        console.log(chalk.red(err.stack));
    }
}

async function fetchAll(array) {
    let coords = [];
    for(const address of array) {
        coords.push(processRawJSON(await fetchOne(address)));
    }

    // print table to console for reference
    console.table(coords);
    return coords;
}



module.exports = {
    fetchAll,
};
