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

function processRawJSON(data){
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

async function fetchOne(cellData){
    try {
        async_log(`Fetch ${chalk.green(cellData)} from Google API`);
        // let res;
        //
        // try {
        //     res = await googleMapsClient.geocode({ address: cellData }).asPromise();
        // } catch (googleErr) {
        //     return {
        //         formatted_address: cellData,
        //         geometry: {
        //             location: {
        //                 lat: chalk.red(googleErr.json.error_message),
        //                 lng: ''
        //             }
        //         }
        //     };
        // }

        // const res = await googleMapsClient.geocode({ address: cellData }).asPromise();

        // mock API data for testing
        return {
            formatted_address: 'Matrix house, Milton Keynes',
            geometry: {
                location: {
                    lat: 10.1010,
                    lng: 11.0101
                }
            }
        };

        const resType = res.json.results[0].geometry.location_type;
        const resValid = ['street_address', 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER'];
        if(resValid.includes(resType)) {
            return res.json.results[0];
        } else {
            return {
                formatted_address: cellData,
                geometry: {
                    location: {
                        lat: res.json.results[0].geometry.location_type,
                        lng: 'Please check address accuracy'
                    }
                }
            };
        }
    } catch (err) {
        console.log(err)
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
