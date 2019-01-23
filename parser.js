const xlsx = require('xlsx');
const chalk = require('chalk');
const keys = require('./keys');

// TODO: dynamically work out address/coord columns?
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
    const { formatted_address: addr } = data;
    const { lat, lng } = data.geometry.location;

    return {
        addr: addr,
        lat: lat,
        lng: lng
    }
}

async function fetchOne(address){
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

    // remove first element (column title)
    coords.splice(0, 1);

    return coords;
}

function getWorkbook(filename) {
    return xlsx.readFile(filename);
}

function getWorksheet(filename) {
    const file = xlsx.readFile(filename);
    const firstSheetName = file.SheetNames[0];
    return file.Sheets[firstSheetName];
}

function getAddresses(worksheet) {
    let end_of_column = false;
    let column = config.READ_ADDRESS_COLUMN;
    let row = config.READ_ADDRESS_ROW_START;
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

function writeToNewFile(worksheet, workbook) {
    worksheet['!ref'] = config.areaRef;
    worksheet['!cols'] = [{ wpx: 150 }, { wpx: 95 }, { wpx: 95 }];
    let newWorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkBook, worksheet, 'Processed Sheet1');
    xlsx.writeFile(newWorkBook, `processed-${config.FILENAME}`);
}


const workbook = getWorkbook(config.FILENAME);
const worksheet = getWorksheet(config.FILENAME);


fetchAll(getAddresses(worksheet)).then(coords => {
    // console.table(res);
    mergeResults(coords, worksheet);
    writeToNewFile(worksheet, workbook);
});

