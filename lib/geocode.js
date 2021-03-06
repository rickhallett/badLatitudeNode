const fs = require('fs');
const cloneDeep = require('lodash').cloneDeep;
const chalk = require('chalk');
const keys = require('../config/keys');
const config = require('../xlsx_config');

const async_log = require('debug')('async: http');
async_log.enabled = true;
const log = require('debug')('sync: sync');
log.enabled = true;

const googleMapsClient = require('@google/maps').createClient({
    key: keys.googlemaps,
    Promise: Promise
});

class Cache {
    constructor() {
        try {
            this.hardCache = this.readJSONCache();
        } catch (err) {
            console.log(chalk.red('hardCache.json not present, preparing file...'));
            this.writeJSONCache({});
            this.hardCache = this.readJSONCache();
        }

    }

    readJSONCache() {
        let data = fs.readFileSync(`${config.ROOT_DIR}/hardCache.json`);
        console.log(typeof data);

        if(data) {
            data = JSON.parse(data);
        }

        if(!data.queries) {
            return {
                queries:[]
            };
        }

        return data;
    }

    writeJSONCache(data) {
        fs.writeFileSync(`${config.ROOT_DIR}/hardCache.json`, JSON.stringify(data), {
            encoding: 'utf8',
            flag: 'w'
        });
    }

    addData(data) {
        let currentData = this.readJSONCache();
        currentData.queries.push(data);
        this.writeJSONCache(currentData);
        return currentData;
    }

    constructError(cellData, res) {
        return {
            query: cellData,
            nullError: true,
            addr: res.addr,
            lat: res.lat,
            lng: res.lng
        }
    }

    constructRes(cellData, res) {
        return {
            query: cellData,
            nullError: false,
            formatted_address: res.formatted_address,
            geometry: {
                location: {
                    lat: res.geometry.location.lat,
                    lng: res.geometry.location.lng
                }
            }
        }
    }

    add(cellData, res) {
        if(res.nullError) {
            const errorObject = this.constructError(cellData, res);
            this.hardCache = this.addData(errorObject);
        } else {
            const queryObject = this.constructRes(cellData, res);
            this.hardCache = this.addData(queryObject);
        }
    }

    check(address) {
        let found;

        if(this.hardCache.queries) {
            this.hardCache.queries.forEach(store => {
                if(store.query === address) {
                    // decouple memory reference to store (hardCache object) here
                    // otherwise nullError gets deleted during data sanitisation later
                    found = cloneDeep(store);
                }
            });
        }


        return found ? found : false;
    }
}

const addressCache = new Cache();

function processRawJSON(data){
    if(data.nullError) {
        delete data.nullError;
        delete data.query;
        return data;
    }
    try {
        log('processing raw JSON');
        const { formatted_address: addr } = data;
        let { lat, lng } = data.geometry.location;

        if(typeof lat === 'number') {
            lat = Number.parseFloat(lat.toFixed(4));
        }

        if(typeof lng === 'number') {
            lng = Number.parseFloat(lng.toFixed(4));
        }

        return {
            addr,
            lat,
            lng
        }
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError processing Google Maps Geocode returned JSON\n'));
        console.log(chalk.red(err.stack));
        process.exit(1);
    }
}

async function checkForGoogleErrors(cellData) {
    let res;

    try {
        res = await googleMapsClient.geocode({ address: cellData }).asPromise();
    } catch (googleErr) {
        return {
            nullError: true,
            addr: cellData,
            lat: googleErr.json.error_message,
            lng: ''
        }
    }

    return res;
}

function checkLocationTypeIsValid(res, cellData) {
    if(!res.json) {
        return res;
    }
    const resType = res.json.results[0].geometry.location_type;
    const resValid = ['street_address', 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER'];
    if(resValid.includes(resType)) {
        return res.json.results[0];
    } else {
        return {
            nullError: true,
            addr: cellData,
            lat: res.json.results[0].geometry.location_type,
            lng: 'Please check address accuracy'
        };
    }
}

async function fetchOne(cellData){
    try {
        const cached = addressCache.check(cellData);

        if(cached) {
            log(`Fetch ${chalk.green(cellData)} from cache`);
            return cached;
        }

        async_log(`Fetch ${chalk.green(cellData)} from Google API`);
        let res;
        res = await checkForGoogleErrors(cellData);
        res = checkLocationTypeIsValid(res, cellData);

        if(res) {
            addressCache.add(cellData, res);
            return res;
        }

    } catch (err) {
        console.log(err);
        console.log(chalk.yellow.underline.bgRed('\nError fetching address from Google Geocode API\n'));
        console.log(chalk.red(err.stack));
        process.exit(1);
    }
}

async function fetchAll(array) {
    let coords = [];
    for(const address of array) {
        if(config.COLUMN_TITLES.includes(address)) {
            continue;
        }
        coords.push(processRawJSON(await fetchOne(address)));
    }

    // print table to console for reference
    console.table(coords);
    return coords;
}



module.exports = {
    fetchAll,
};
