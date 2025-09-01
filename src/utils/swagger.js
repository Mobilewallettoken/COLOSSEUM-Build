const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Crypto Buy and Sell API',
        version: '1.0.0',
        description: 'API for getting crypto buy and sell',
    },
    servers: [
        {
            url: 'https://dev.bitcoin.wallet2cash.com', // Update with your server URL
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJSDoc(options);

module.exports = swaggerDocs;
