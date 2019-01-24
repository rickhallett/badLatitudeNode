const fs = require('fs');
const cluster = require('cluster');
const { promisify } = require('util');
const xlsx = require('xlsx');
const chalk = require('chalk');
const keys = require('./keys');
const createDebug = require('debug');
const async_log = createDebug('async: http');
async_log.enabled = true;
const log = createDebug('sync: sync');
log.enabled = true;

// TODO: dynamically work out address/coord columns?
// sheets["!refs"]
const config = {
    READ_ADDRESS_COLUMN: 'A',
    READ_ADDRESS_ROW_START: 1,
    WRITE_ADDRESS_COLUMN_LATITUDE: 'B',
    WRITE_ADDRESS_COLUMN_LONGITUDE: 'C',
    WRITE_ADDRESS_ROW_START: 1,
    FILENAME: 'excel_example.xlsx'
};

const googleMapsClient = require('@google/maps').createClient({
    key: keys.googlemaps,
    Promise: Promise
});

function processRawJSON(data){
    log('processing raw JSON');
    const { formatted_address: addr } = data;
    const { lat, lng } = data.geometry.location;

    return {
        addr: addr,
        lat: lat,
        lng: lng
    }
}

async function fetchOne(address){
    async_log('Fetch address from Google API');
    const res = await googleMapsClient.geocode({ address: address }).asPromise();

    if(!res) {
        return null;
    } else {
        return res.json.results[0];
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

function getWorkbook(filename) {
    return xlsx.readFile(filename);
}

function getWorksheet(filename) {
    log('Reading in worksheet');
    const file = xlsx.readFile(filename);
    const firstSheetName = file.SheetNames[0];
    return file.Sheets[firstSheetName];
}

function getAddresses(worksheet) {
    log('Processing address column into memory');
    let end_of_column = false;
    let column = config.READ_ADDRESS_COLUMN;
    let row = config.READ_ADDRESS_ROW_START;
    // remove first element (column title)
    delete worksheet[`${column}${row}`];
    row++;
    let addresses = [];
    while(!end_of_column) {
        const cell = `${column}${row}`;
        if(worksheet[cell]) {
            addresses.push(worksheet[cell].h);
            row++;
        } else {
            end_of_column = true;
        }
    }
    return addresses;
}

function mergeResults(results, worksheet) {
    log('Merge results into worksheet');
    let lat_column = config.WRITE_ADDRESS_COLUMN_LATITUDE;
    let long_column = config.WRITE_ADDRESS_COLUMN_LONGITUDE;
    let row = config.WRITE_ADDRESS_ROW_START;

    worksheet[`${lat_column}${row}`] = { v: 'Latitude' };
    worksheet[`${long_column}${row}`] = { v: 'Longitude' };
    row++;

    results.forEach((el) => {
        worksheet[`${lat_column}${row}`] = { v: el.lat };
        worksheet[`${long_column}${row}`] = { v: el.lng };
        row++;
    });

    config.areaRef = `A1:${long_column}${row - 1}`
}

function writeToNewFile(worksheet, nextSheetName) {
    log(`Writing to new file: processed-${nextSheetName}`);
    worksheet['!ref'] = config.areaRef;
    worksheet['!cols'] = [{ wpx: 150 }, { wpx: 95 }, { wpx: 95 }];
    let newWorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkBook, worksheet, 'Processed Sheet1');
    xlsx.writeFile(newWorkBook, `processed-${nextSheetName}`);
}



// Main

// if(cluster.isMaster) {

    // Use multi-threading for potential speed improvements
    // cluster.fork();
    // cluster.fork();
    // cluster.fork();
    // cluster.fork();

// } else {


    fs.readdir(__dirname, function (err, items) {

        const excelSheets = [];
        const isExcelSheet = (filename) => filename.match(/(\w)+(.xlsx)/);
        const isNotProcessed = (filename) => !filename.match(/(processed-)/);

        items.forEach(filename => {
            if (isExcelSheet(filename) && isNotProcessed(filename)) {
                excelSheets.push(filename);
            }
        });

        async function asyncRecurse(nextSheet) {
            if (!nextSheet) {
                return false;
            } else {
                const worksheet = getWorksheet(nextSheet);
                fetchAll(getAddresses(worksheet)).then(coords => {
                    mergeResults(coords, worksheet);
                    writeToNewFile(worksheet, nextSheet);

                    return asyncRecurse(excelSheets.pop());
                }).catch(err => {
                    console.log(err.message);
                });
            }

        }

        asyncRecurse(excelSheets.pop());

    });


// }



