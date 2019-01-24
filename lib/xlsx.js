const xlsx = require('xlsx');
const cloneDeep = require('lodash').cloneDeep;
const chalk = require('chalk');
const config = require('../xlsx_config');

const async_log = require('debug')('async: http');
async_log.enabled = true;
const log = require('debug')('sync: sync');
log.enabled = true;

function getWorksheet(filename) {
    try {
        log('Reading in worksheet');
        const file = xlsx.readFile(filename);
        const firstSheetName = file.SheetNames[0];
        return file.Sheets[firstSheetName];
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError reading in worksheet\n'));
        console.log(chalk.red(err.stack));
    }
}

function getAddresses(worksheet) {
    try {
        log('Processing address column into memory');
        let end_of_column = false;
        let column = config.READ_ADDRESS_COLUMN;
        let row = config.READ_ADDRESS_ROW_START;
        // remove first element (column title)
        // delete worksheet[`${column}${row}`];
        // row++;
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
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError processing new address columns\n'));
        console.log(chalk.red(err.stack));
    }
}

function shiftEndColumns(worksheet) {
    const columnLength = worksheet['!ref'].substring(4);

    for(let i = 1; i <= columnLength; i++) {
        if(worksheet[`H${i}`]) {
            worksheet[`J${i}`] = cloneDeep(worksheet[`H${i}`]);
            delete worksheet[`H${i}`];
        }

        if(worksheet[`I${i}`]) {
            worksheet[`K${i}`] = cloneDeep(worksheet[`I${i}`]);
            delete worksheet[`I${i}`]
        }
    }
}

function mergeResults(results, worksheet) {
    try {
        log('Merge results into worksheet');
        let lat_column = config.WRITE_ADDRESS_COLUMN_LATITUDE;
        let long_column = config.WRITE_ADDRESS_COLUMN_LONGITUDE;
        let row = config.WRITE_ADDRESS_ROW_START;

        shiftEndColumns(worksheet);

        worksheet[`${lat_column}${row}`] = { v: 'Latitude' };
        worksheet[`${long_column}${row}`] = { v: 'Longitude' };
        row++;

        results.forEach((el) => {
            if(!config.COLUMN_TITLES.includes(el)) {
                worksheet[`${lat_column}${row}`] = { v: el.lat };
                worksheet[`${long_column}${row}`] = { v: el.lng };
                row++;
            }
        });

        config.areaRef = `A1:${config.WRITE_ADDRESS_COLUMN_CONTROL}${row - 1}`
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError merging results into worksheet\n'));
        console.log(chalk.red(err.stack));
    }
}

function writeToNewFile(worksheet, nextSheetName) {
    try {
        log(`Writing to new file: processed-${nextSheetName}`);
        worksheet['!ref'] = config.areaRef;
        worksheet['!cols'] = [{ wpx: 57 }, { wpx: 80 }, { wpx: 120 }, { wpx: 131 }, { wpx: 125 }, { wpx: 35 }, { wpx: 280 }, { wpx: 60 }, { wpx: 60 }, { wpx: 95 }, { wpx: 95 }];
        let newWorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkBook, worksheet, 'Processed Sheet1');
        xlsx.writeFile(newWorkBook, `./address_files/processed-${nextSheetName}`);
    } catch (err) {
        console.log(chalk.yellow.underline.bgRed('\nError writing to file\n'));
        console.log(chalk.red(err.stack));
    }
}


module.exports = {
    config,
    getWorksheet,
    getAddresses,
    mergeResults,
    writeToNewFile
};
