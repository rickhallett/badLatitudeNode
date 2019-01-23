const xlsx = require('xlsx');
const chalk = require('chalk');
const keys = require('./keys');

const googleMapsClient = require('@google/maps').createClient({
    key: keys.googlemaps,
    Promise: Promise
});

const processRawJSON = (data) => {
    const { formatted_address: addr } = data;
    const { lat, lng } = data.geometry.location;

    return {
        addr: addr,
        lat: lat,
        lng: lng
    }
};

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

    return coords;
}

const config = {
    ADDRESS_COLUMN: 'A',
    ADDRESS_ROW_START: 1
};


const getWorksheet = (filename) => {
    const file = xlsx.readFile(filename);
    const firstSheetName = file.SheetNames[0];
    return file.Sheets[firstSheetName];
};

const getAddresses = (worksheet) => {
    let end_of_column = false;
    let row = 1;
    let addresses = [];
    while(!end_of_column) {
        const cell = `A${row}`;
        if(worksheet[cell]) {
            addresses.push(worksheet[cell].h);
            row++;
        } else {
            end_of_column = true;
        }
    }
    return addresses;
};




fetchAll(
    getAddresses(
        getWorksheet('excel_example.xlsx')
    )).then(res => console.table(res));


const breakpoint = 'this is a breakpoint.';
