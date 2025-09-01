const { providers, approve, signerAdmin } = require('../utils/utils');
const chainId = 56;
const Web3 = require('web3');
const fetch = require('node-fetch');
const web3 = new Web3.Web3(providers.bsc);
const broadcastApiUrl = 'https://api.1inch.dev/tx-gateway/v1.1/' + chainId + '/broadcast';
const apiBaseUrl = 'https://api.1inch.dev/swap/v6.0/' + chainId;
const headers = {
    headers: {
        Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        accept: 'application/json',
    },
};

function apiRequestUrl(methodName, queryParams) {
    return apiBaseUrl + methodName + '?' + new URLSearchParams(queryParams).toString();
}

// Post raw transaction to the API and return transaction hash
async function broadCastRawTransaction(rawTransaction) {
    return fetch(broadcastApiUrl, {
        method: 'post',
        body: JSON.stringify({ rawTransaction }),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
    })
        .then((res) => res.json())
        .then((res) => {
            console.log(' --------');
            console.log('res:', res);
            console.log(' --------');
            return res.transactionHash;
        });
}

// Sign and post a transaction, return its hash
async function signAndSendTransaction(transaction) {
    try {
        const { rawTransaction } = await web3.eth.accounts.signTransaction(
            transaction,
            process.env.keyEVM,
        );

        return await broadCastRawTransaction(rawTransaction);
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
    }
}

async function buildTxForSwap(swapParams) {
    const url = apiRequestUrl('/swap', swapParams);
    return fetch(url, headers)
        .then((res) => res.json())
        .then((res) => res.tx);
}

const swapOneInch = async (swapParams) => {
    try {
        const txApprove = await approve(swapParams.src, swapParams.amount, signerAdmin);

        console.log('Approve tx hash: ', txApprove);

        const swapTransaction = await buildTxForSwap(swapParams);
        console.log('Transaction for swap: ', swapTransaction);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const swapTxHash = await signAndSendTransaction(swapTransaction);
        console.log('Swap tx hash: ', swapTxHash);

        return swapTxHash;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

module.exports = { swapOneInch };
