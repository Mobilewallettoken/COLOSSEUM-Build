const axios = require('axios');

async function convertToCurrency(fromCurrency, amount, endpoint) {
    try {
        if (endpoint === 'buy') {
            const apiUrl = `https://data.fixer.io/api/convert?access_key=${
                process.env.FIXER_API_KEY
            }&from=${fromCurrency}&to=USD&amount=${amount * 0.98}`;
            const response = await axios.get(apiUrl);
            return response.data;
        } else {
            const apiUrl = `https://data.fixer.io/api/convert?access_key=${
                process.env.FIXER_API_KEY
            }&from=${fromCurrency}&to=USD&amount=${amount * 1.02}`;
            const response = await axios.get(apiUrl);
            return response.data;
        }
    } catch (error) {
        console.error('Error converting currency:', error.message);
        throw error;
    }
}

module.exports = { convertToCurrency };
