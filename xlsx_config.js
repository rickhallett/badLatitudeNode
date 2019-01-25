const config = {
    READ_ADDRESS_COLUMN: 'G',
    READ_ADDRESS_ROW_START: 1,
    WRITE_ADDRESS_COLUMN_LATITUDE: 'H',
    WRITE_ADDRESS_COLUMN_LONGITUDE: 'I',
    WRITE_ADDRESS_COLUMN_MEM_LEAK: 'J',
    WRITE_ADDRESS_COLUMN_CONTROL: 'K',
    MEM_LEAK: 'Memory Leak?',
    CONTROL: 'Control',
    WRITE_ADDRESS_ROW_START: 1,
    ROOT_DIR: '/Users/richardhallett/Code/badLatitudeNode',
    ADDRESS_FILE_DIRECTORY: `${__dirname}/address_files`,
    TERMINATE_AFTER_PARSE: true,
    COLUMN_TITLES: ['Central D', 'Store number','Brand','Store Name','Address', 'City', 'State', 'Street', 'Longitude', 'Latitude', 'Memory Leak?', 'Control']
};

module.exports = config;
