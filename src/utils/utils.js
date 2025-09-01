const { ethers, BigNumber, MaxUint256, Contract } = require('ethers');
const ERC20_ABI = require('./ABIs/tokenAbi.json');
const { parseUnits, formatEther, isAddress } = require('ethers/lib/utils');
const { Keypair, Connection, PublicKey } = require('@solana/web3.js');
const bip39 = require('bip39');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bip32 = BIP32Factory(ecc);
const bs58 = require('bs58').default;
const { Wallet } = require('@project-serum/anchor');

const evm = async (walletCount) => {
    const hdnode = ethers.utils.HDNode.fromMnemonic(process.env.MID_MNEMONIC);
    // eslint-disable-next-line
    const path = "m/44'/60'/0'/0/";
    const walletNode = hdnode.derivePath(path + walletCount.toString());
    const wallet = walletNode.address;

    return wallet;
};

const solGenerate = async (walletCount) => {
    try {
        const seed = await bip39.mnemonicToSeed(process.env.MID_MNEMONIC);

        // Derive a private key using a BIP44 derivation path
        const root = bip32.fromSeed(seed);
        // eslint-disable-next-line
        const derivationPath = "m/44'/501'/0'/";
        const fullpath = derivationPath + `${walletCount}'`;
        const child = root.derivePath(fullpath);

        // Create a Keypair from the derived private key
        const keypair = Keypair.fromSeed(child.privateKey.slice(0, 32));

        // Extracting the secret key
        const secretKey = keypair.secretKey;
        console.log('Secret Key Uint8Array:', secretKey);

        // Converting the private key to a base58 string
        const PrivateKey = bs58.encode(keypair.secretKey);

        const PublicKey = keypair.publicKey.toBase58();

        return { PrivateKey, PublicKey };
    } catch (e) {
        console.log('error=======>', e.message);
    }
};

let walletAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
const providers = {
    bsc: 'https://few-maximum-fog.bsc.quiknode.pro/028ae6f1f0f734dee7831cd9dea2cdb485c97339/',
    sol: 'https://tame-tiniest-silence.solana-mainnet.quiknode.pro/0413c1fa8cfaa3d091114e9c29102c2ff3041759',
};

const sol_connection = new Connection(providers.sol, 'confirmed');

const walletSolAdmin = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.keySOL)));

async function getTokenBalancesSol(wallet, tokenPublicKey, connection, cryptoMetaData) {
    try {
        let balance_sol;
        if (cryptoMetaData.symbol === 'SOL') {
            balance_sol = await connection.getBalance(new PublicKey(wallet.publicKey.toString()));
        } else {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                new PublicKey(wallet.publicKey.toString()),
                {
                    mint: tokenPublicKey,
                },
            );

            balance_sol = tokenAccounts.value.reduce((acc, tokenAccount) => {
                return acc + tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
            }, 0);
        }

        if (balance_sol === 0) {
            return balance_sol;
        } else {
            if (cryptoMetaData.symbol === 'SOL') {
                let x = ethers.utils.formatUnits(balance_sol.toString(), cryptoMetaData.decimals);
                return +x;
            } else return +balance_sol;
        }
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return 0;
    }
}

const evmPrivateKey = (walletCount) => {
    const hdnode = ethers.utils.HDNode.fromMnemonic(process.env.MID_MNEMONIC);
    // eslint-disable-next-line
    const path = "m/44'/60'/0'/0/";
    const walletNode = hdnode.derivePath(path + walletCount.toString());
    const privateKey = walletNode.privateKey;

    return privateKey;
};

const bscProvider = new ethers.providers.JsonRpcProvider(providers.bsc);

const signerAdmin = new ethers.Wallet(process.env.keyEVM, bscProvider);

const transferTokens = async (tokenAddress, amount, recipient, decimals, signer) => {
    try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const amountToSend = ethers.utils.parseUnits(amount, decimals);
        let fn = contract.estimateGas.transfer;
        let data = [recipient, amountToSend];
        let fee = await gasEstimationForAll(signer.address, fn, data);

        const tx = await contract.transfer(recipient, amountToSend, {
            gasLimit: fee,
        });
        await tx.wait();
        console.log(`Transaction hash: ${tx.hash}`);
        return tx.hash;
    } catch (error) {
        console.error('Error transferring tokens:', error);
        return false;
    }
};

const nativeTransfer = async (amount, recipient, signer) => {
    try {
        const tx = await signer.sendTransaction(
            {
                to: recipient,
                value: ethers.utils.parseEther(amount.toString()),
            },
            {
                gasLimit: 21000,
            },
        );
        await tx.wait();
        console.log(`Transaction hash: ${tx.hash}`);
        return tx.hash;
    } catch (error) {
        console.error('Error transferring tokens:', error);
        throw error;
    }
};

const checkTokenBalance = async (tokenAddress, decimals, adminSigner) => {
    try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, adminSigner);
        const balance = await contract.balanceOf(adminSigner.address);
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        console.log(`Balance: ${formattedBalance}`);
        return formattedBalance;
    } catch (error) {
        console.error('Error checking token balance:', error);
        throw error;
    }
};

const checkBNBBalance = async (adminSigner) => {
    try {
        const balance = await adminSigner.getBalance();
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log(`BNB Balance: ${formattedBalance}`);
        return formattedBalance;
    } catch (error) {
        console.error('Error checking BNB balance:', error);
        throw error;
    }
};

function calculateGasMargin(value) {
    return +(
        (value * BigNumber.from(10000).add(BigNumber.from(1000))) /
        BigNumber.from(10000)
    ).toFixed(0);
}
// eslint-disable-next-line
const gasEstimationPayable = async (account, fn, data, amount) => {
    if (account) {
        const estimateGas = await fn(...data, MaxUint256).catch(() => {
            return fn(...data, { value: amount.toString() });
        });
        return calculateGasMargin(estimateGas);
    }
};

const gasEstimationForAll = async (account, fn, data) => {
    if (account) {
        const estimateGas = await fn(...data, MaxUint256).catch(() => {
            return fn(...data);
        });
        return calculateGasMargin(estimateGas);
    }
};

const approve = async (fromToken, amount, adminSigner) => {
    try {
        const contract = new Contract(fromToken, ERC20_ABI, adminSigner);

        let data = ['0x111111125421ca6dc452d289314280a0f8842a65', amount];
        let fn = contract.estimateGas.approve;
        let fee = await gasEstimationForAll(walletAddress, fn, data);

        const tx = await contract.approve(...data, {
            gasLimit: fee,
        });
        await tx.wait();
        console.log(tx.hash, 'approve');
        return tx.hash;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

const removeGasFeeFromBalance = async (bal, adminSigner) => {
    // in case of bnb deduct this much
    let gasPrice = await adminSigner.getGasPrice();

    const transactionTest = {
        to: adminSigner.address,
        value: parseUnits(bal.toString()),
    };

    let estimatedGas = await adminSigner.estimateGas(transactionTest);

    let transactionFee = gasPrice * estimatedGas;
    transactionFee = formatEther(transactionFee);
    transactionFee = +transactionFee + 0.003;
    bal = bal - transactionFee;
    return bal;
};

const transferGasFeeTorecepient = async (bal, adminSigner, userAddress, fromToken, decimals) => {
    // in case of other token send this much
    try {
        let data = [adminSigner.address, parseUnits(bal, decimals)];
        const contract = new Contract(fromToken, ERC20_ABI, adminSigner);
        let fn = contract.estimateGas.transfer;
        let fee = await gasEstimationForAll(adminSigner.address, fn, data);

        let gasPrice = await bscProvider.getGasPrice();

        let transactionFee = gasPrice * fee;

        transactionFee = formatEther(transactionFee);
        transactionFee = +transactionFee + 0.003;

        const transaction = {
            to: userAddress,
            value: parseUnits(transactionFee.toString()).toString(),
            gasPrice: gasPrice,
        };

        let estimatedGas = await adminSigner.estimateGas(transaction);
        transaction.gasLimit = estimatedGas;

        const tx = await adminSigner.sendTransaction(transaction);
        await tx.wait();
        return true;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

const generateSigner = (walletCount) => {
    const privateKey = evmPrivateKey(walletCount);
    const signer = new ethers.Wallet(privateKey, bscProvider);

    return signer;
};

function isValidSolanaAddress(address) {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

const isValidEvm = (address) => {
    const isValid = isAddress(address);
    return isValid;
};

function formatDecimal(value) {
    // Convert to string to handle different input types
    const strValue = String(value);

    // Check if the value has a decimal point
    if (strValue.includes('.')) {
        // eslint-disable-next-line
        const [integerPart, decimalPart] = strValue.split('.');

        // If decimal part has more than 4 digits, round to 4
        if (decimalPart.length > 6) {
            // Parse to float and use toFixed to round to 4 decimal places
            return parseFloat(value).toFixed(6);
        } else {
            // Return as is if decimal places are already 4 or fewer
            return strValue;
        }
    } else {
        // Return as is if there are no decimal places
        return strValue;
    }
}

module.exports = {
    evm,
    providers,
    bscProvider,
    transferTokens,
    nativeTransfer,
    signerAdmin,
    checkTokenBalance,
    checkBNBBalance,
    approve,
    evmPrivateKey,
    removeGasFeeFromBalance,
    transferGasFeeTorecepient,
    generateSigner,
    solGenerate,
    sol_connection,
    walletSolAdmin,
    getTokenBalancesSol,
    isValidSolanaAddress,
    isValidEvm,
    formatDecimal,
};
