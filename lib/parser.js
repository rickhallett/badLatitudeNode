const fs = require('fs');
const chalk = require('chalk');
const { fetchAll } = require('./geocode');
const {
    getWorksheet,
    getAddresses,
    mergeResults,
    writeToNewFile } = require('./xlsx');
const config = require('../xlsx_config');


// Main

function fileParser(file, terminate) {
    if(!file) {
        fs.readdir(config.ADDRESS_FILE_DIRECTORY, function (err, items) {
            if(err) {
                console.log(chalk.yellow.underline.bgRed('\nError reading from files:\n'));
                console.table(items);
                return;
            }

            const excelSheets = [];
            const isExcelSheet = (filename) => filename.match(/(\w)+(.xlsx)/);
            const isNotProcessed = (filename) => !filename.match(/(processed-)/);

            items.forEach(filename => {
                if (isExcelSheet(filename) && isNotProcessed(filename)) {
                    excelSheets.push(filename);
                }
            });

            console.log(chalk.green('Reading from files:'));
            console.table(excelSheets);

            async function asyncRecurse(nextSheet) {
                if (!nextSheet) {
                    return terminate(config.TERMINATE_AFTER_PARSE);
                } else {
                    const worksheet = getWorksheet(`${config.ADDRESS_FILE_DIRECTORY}/${nextSheet}`);
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
    } else {
        const worksheet = getWorksheet(`${config.ADDRESS_FILE_DIRECTORY}/${file}`);

        fetchAll(getAddresses(worksheet)).then(coords => {
            // console.table(res);
            mergeResults(coords, worksheet);
            writeToNewFile(worksheet, file);
            terminate(config.TERMINATE_AFTER_PARSE);
        });
    }



}

module.exports = {
    fileParser
};







