const xlsx = require('xlsx');
const chalk = require('chalk');
const keys = require('./keys');

const config = {
  ADDRESS_COLUMN: 'A',
  ADDRESS_ROW_START: 1
};

const excel_example = xlsx.readFile('excel_example.xlsx');
const firstSheetName = excel_example.SheetNames[0];
const worksheet = excel_example.Sheets[firstSheetName];

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

const home = '16 Streche road Swanage Dorset BH19 1NF';
const work = 'Matrix House North Fourth Street Milton Keynes MK9 1AY';
const dr = 'Swanage Medical Practice';
const testAddrArray = [home, work, dr];

fetchAll(testAddrArray).then(res => console.table(res));


const breakpoint = 'this is a breakpoint.';
