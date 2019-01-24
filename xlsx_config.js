const config = {
    READ_ADDRESS_COLUMN: 'A',
    READ_ADDRESS_ROW_START: 1,
    WRITE_ADDRESS_COLUMN_LATITUDE: 'B',
    WRITE_ADDRESS_COLUMN_LONGITUDE: 'C',
    WRITE_ADDRESS_ROW_START: 1,
    ADDRESS_FILE_DIRECTORY: `${__dirname}/address_files`
};

console.log(config.ADDRESS_FILE_DIRECTORY)

module.exports = config;
