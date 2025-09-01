const { PublicKey } = require('@solana/web3.js');

const axios = require('axios');
const { ethers } = require('ethers');

const getSolanaQuote = async (tokenA, tokenB, amount, slippage) => {
    const fetch = (await import('node-fetch')).default;

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${tokenA}&outputMint=${tokenB}&amount=${Number(
        amount,
    ).toFixed(0)}&slippageBps=${slippage * 100}`;
    let quote = null;
    try {
        quote = await fetch(url);

        quote = await quote.json();

        if (!quote) {
            console.error('unable to quote');
            return null;
        }

        return quote;
    } catch (e) {
        console.log('Error getting amount out', e);
        return null;
    }
};

const get1InchQuote = async (tokenA, tokenB, amount, _slippage, cryptoMetaData) => {
    const url = 'https://api.1inch.dev/swap/v6.0/56/quote';

    const config = {
        headers: {
            'Content-Type': 'application/json', // Add your desired headers here
            Accept: 'application/json',
            Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
        params: {
            src: `${tokenA}`,
            dst: `${tokenB}`,
            amount: `${amount}`,
        },
        paramsSerializer: {
            indexes: null,
        },
    };

    try {
        const response = await axios.get(url, config);

        if (cryptoMetaData.symbol === 'BNB')
            return ethers.utils.formatUnits(response.data.dstAmount);
        else return ethers.utils.formatUnits(response.data.dstAmount, cryptoMetaData.decimals);
    } catch (error) {
        console.error(error);
        throw new Error(error.message);
    }
};

const getSolanaTokens = (tokenAddress) => {
    try {
        const USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
        const token_MINT = new PublicKey(tokenAddress);

        return { USDT_MINT, token_MINT };
    } catch (error) {
        console.error(error);
        throw new Error(error.message);
    }
};

const get1InchTokens = (tokenAddress) => {
    const usdt = '0x55d398326f99059fF775485246999027B3197955';
    const token = tokenAddress;

    if (!ethers.utils.isAddress(usdt) || !ethers.utils.isAddress(token)) {
        throw new Error('Invalid token address');
    }

    return { USDT_MINT: usdt, token_MINT: token };
};

const getAmountWithDecimals = (cryptoMetaData, amount) => {
    let amountWithDecimals = ethers.utils.parseUnits(amount, cryptoMetaData.decimals);

    return amountWithDecimals;
};

module.exports = {
    getSolanaQuote,
    getSolanaTokens,
    get1InchTokens,
    get1InchQuote,
    getAmountWithDecimals,
};
