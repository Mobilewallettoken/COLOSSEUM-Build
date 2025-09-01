const bitcoin = require('bitcoinjs-lib');
const { BTCPrivateKey, BTCWallet } = require('./btc_utils');
const { default: axios } = require('axios');

const btcTransfer = async (recipientAddress, amount) => {
    try {
        const adminAddress = await BTCWallet(0);
        const adminPrivateKey = await BTCPrivateKey(0);

        const apiUrlFee = 'https://mempool.space/api/v1/fees/recommended';
        const feeData = await axios.get(apiUrlFee).catch((error) => {
            console.error(`Error estimating fee: ${error.response.data.error}`);
        });

        const feeRates = feeData.data;
        const feeRate = feeRates.fastestFee;

        // Get the inputs of the source address
        const data = await axios
            .get(
                `https://api.blockcypher.com/v1/btc/main/addrs/${adminAddress}?unspentOnly=true&token=${process.env.BLOCKCYPHER}`,
            )
            .catch((error) => {
                console.error(`Error fetching inputs: ${error.response.data.error}`);
            });

        const inputs = data?.data.txrefs;

        // Calculate the total input value
        const totalInput = inputs.reduce((acc, input) => acc + input.value, 0);
        const send = Math.floor(amount * 100000000);
        // Create a PSBT (Partially Signed Bitcoin Transaction)
        const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

        // Add the inputs to the PSBT
        inputs.forEach((input) => {
            psbt.addInput({
                hash: input.tx_hash,
                index: input.tx_output_n,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(adminAddress, bitcoin.networks.bitcoin),
                    value: input.value,
                },
            });
        });

        // Estimate and set the fee based on the recommended fee rate
        const fee = Math.ceil(psbt.__CACHE.__TX.virtualSize() * feeRate) * 4;

        // Add the output to the PSBT
        psbt.addOutput({
            address: recipientAddress,
            value: send,
        });
        psbt.addOutput({
            address: adminAddress,
            value: totalInput - send - fee,
        });
        psbt.txFee = fee;

        // Sign the inputs with the private key of the source address
        inputs.forEach((_input, index) => {
            psbt.signInput(index, adminPrivateKey);
        });

        // Finalize the PSBT
        psbt.finalizeAllInputs();

        // Build and broadcast the transaction to the network
        const txHex = psbt.extractTransaction().toHex();
        const tx = await axios
            .post(
                `https://api.blockcypher.com/v1/btc/main/txs/push?token=${process.env.BLOCKCYPHER}`,
                { tx: txHex },
            )
            .then((response) => {
                console.log(`Transaction broadcasted with txid: ${response.data.tx.hash}`);
                return response.data.tx.hash;
            });

        return tx;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};



const btcMidTransfer = async (walletCount) => {
    try {
        const sourceAddress = await BTCWallet(walletCount);
        const middleprivateKey = await BTCPrivateKey(walletCount);

        const adminAddress = await BTCWallet(0);
        // Get the current recommended fee rates
        const apiUrlFee = 'https://mempool.space/api/v1/fees/recommended';
        const feeData = await axios.get(apiUrlFee).catch((error) => {
            console.error(`Error estimating fee: ${error.response.data.error}`);
        });
        const feeRates = feeData.data;
        const feeRate = feeRates.fastestFee;

        // Get the inputs of the source address
        const data = await axios
            .get(
                `https://api.blockcypher.com/v1/btc/main/addrs/${sourceAddress}?unspentOnly=true&token=${process.env.BLOCKCYPHER}`,
            )
            .catch((error) => {
                console.error(`Error fetching inputs: ${error.response.data.error}`);
            });

        const inputs = data?.data.txrefs;

        // Calculate the total input value
        const totalInput = inputs.reduce((acc, input) => acc + input.value, 0);
        // Create a PSBT (Partially Signed Bitcoin Transaction)
        const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

        // Add the inputs to the PSBT
        inputs.forEach((input) => {
            psbt.addInput({
                hash: input.tx_hash,
                index: input.tx_output_n,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(sourceAddress, bitcoin.networks.bitcoin),
                    value: input.value,
                },
            });
        });

        // Estimate and set the fee based on the recommended fee rate
        const fee = Math.ceil(psbt.__CACHE.__TX.virtualSize() * feeRate) * 4;

        console.log(totalInput, fee, totalInput - fee, 'send');
        // Add the output to the PSBT

        psbt.addOutput({
            address: adminAddress,
            value: totalInput - fee,
        });
        psbt.txFee = fee;

        // Sign the inputs with the private key of the source address
        inputs.forEach((_input, index) => {
            psbt.signInput(index, middleprivateKey);
        });

        // Finalize the PSBT
        psbt.finalizeAllInputs();

        // Build and broadcast the transaction to the network
        const txHex = psbt.extractTransaction().toHex();

        const tx = await axios
            .post(
                `https://api.blockcypher.com/v1/btc/main/txs/push?token=${process.env.BLOCKCYPHER}`,
                {
                    tx: txHex,
                },
            )
            .then((response) => {
                console.log(`Transaction broadcasted with txid: ${response.data.tx.hash}`);
                return response.data.tx.hash;
            });

        return tx;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

const btcconfirmTransfer = async (address) => {
    try {
        // Get the inputs of the source address
        const data = await axios
            .get(
                `https://api.blockcypher.com/v1/btc/main/addrs/${address}?unspentOnly=true&token=${process.env.BLOCKCYPHER}`,
            )
            .catch((error) => {
                console.error(`Error fetching inputs: ${error.response.data.error}`);
            });

        const inputs = data?.data.txrefs;

        // Calculate the total input value
        let totalInput = inputs.reduce((acc, input) => acc + input.value, 0);

        totalInput = totalInput / 100000000;

        return totalInput;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return 0;
    }
};

module.exports = {
    btcTransfer,
    btcMidTransfer,
    btcconfirmTransfer,
};
