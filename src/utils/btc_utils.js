const { default: axios } = require('axios');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');

const generateBtcWallet = async (walletCount) => {
    const path = `m/84'/1'/0/0/${walletCount}`;
    const seed = bip39.mnemonicToSeedSync(process.env.MID_MNEMONIC);
    const network = bitcoin.networks.bitcoin;
    const masterKey = bitcoin.bip32.fromSeed(seed, network);
    const { privateKey } = masterKey.derivePath(path);
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: bitcoin.ECPair.fromPrivateKey(privateKey, { network }).publicKey,
        network,
    });

    return address;
};

const generatePrivateKey = async (walletCount) => {
    const path = `m/84'/1'/0/0/${walletCount}`;
    const seed = bip39.mnemonicToSeedSync(process.env.MID_MNEMONIC);
    const network = bitcoin.networks.bitcoin;

    const masterKey = bitcoin.bip32.fromSeed(seed, network);
    const { privateKey } = masterKey.derivePath(path);
    const key = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));

    return key;
};

async function coinMarketCapConvert(receive, send, amount) {
    const {
        data: {
            data: { quote: converted },
        },
    } = await axios.get(
        `https://api.coinmarketcap.com/data-api/v3/tools/price-conversion?amount=${amount}&convert_id=${receive}&id=${send}`,
        {
            headers: {
                'X-CMC_PRO_API_KEY': '7d724422-a062-4e32-9900-159c9404d760',
            },
        },
    );
    return converted[0].price;
}

module.exports.coinMarketCapConvertBTC = coinMarketCapConvert;
module.exports.BTCPrivateKey = generatePrivateKey;
module.exports.BTCWallet = generateBtcWallet;
