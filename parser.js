const xlsx = require('xlsx');
const chalk = require('chalk');

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



const breakpoint = 'this is a breakpoint.';
