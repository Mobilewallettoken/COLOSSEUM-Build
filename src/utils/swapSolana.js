const { web3 } = require('@project-serum/anchor');
const { getSolanaQuote } = require('./getQuotation');
const {
    Transaction,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
} = require('@solana/web3.js');
const {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
} = require('@solana/spl-token');
const { sol_connection } = require('./utils');

const swapSolana = async (tokenA, tokenB, amount, slippage, wallet, connection) => {
    console.log('starting swap...');

    let txid = null;
    let amountOut = null;
    let quote = null;

    try {
        quote = await getSolanaQuote(tokenA, tokenB, amount, slippage);
        amountOut = quote.outAmount;
        if (!amountOut) {
            console.log('quote', quote);
            return false;
        }
    } catch (e) {
        console.log('Error getting quote', e);
        return false;
    }
    try {
        // get serialized transaction
        const swapResult = await (
            await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: wallet.publicKey.toString(),
                    dynamicComputeUnitLimit: true,
                    wrapAndUnwrapSol: true,
                    skipUserAccountsRpcCalls: true,
                    prioritizationFeeLamports: {
                        jitoTipLamports: 10000000,
                    },
                }),
            })
        ).json();

        // submit transaction
        const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
        var transaction = web3.VersionedTransaction.deserialize(swapTransactionBuf);

        transaction.sign([wallet.payer]);
        const rawTransaction = transaction.serialize();
        txid = await connection.sendRawTransaction(rawTransaction, {
            maxRetries: 30,
            skipPreflight: false,
            preflightCommitment: 'processed',
        });
        await connection.confirmTransaction(txid);
        console.log(`https://solscan.io/tx/${txid}`);

        return txid;
    } catch (e) {
        console.log('Transaction didnt confirm in 60 seconds (it is still valid)', e);
        return false;
    }
};

const transferToken = async (
    wallet,
    MINT_ADDRESS,
    DESTINATION_WALLET,
    TRANSFER_AMOUNT,
    numberDecimals,
) => {
    try {
        const sourceAccount = await getOrCreateAssociatedTokenAccount(
            sol_connection,
            wallet,
            new PublicKey(MINT_ADDRESS),
            wallet.publicKey,
        );

        const destinationAccount = await getOrCreateAssociatedTokenAccount(
            sol_connection,
            wallet,
            new PublicKey(MINT_ADDRESS),
            new PublicKey(DESTINATION_WALLET),
        );

        const tx = new Transaction();
        tx.add(
            createTransferInstruction(
                sourceAccount.address,
                destinationAccount.address,
                wallet.publicKey,
                TRANSFER_AMOUNT * Math.pow(10, numberDecimals),
            ),
        );

        const latestBlockHash = await sol_connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = latestBlockHash.blockhash;
        tx.feePayer = wallet.publicKey;

        const txid = await sendAndConfirmTransaction(sol_connection, tx, [wallet]);

        console.log(`https://solscan.io/tx/${txid}`);
        return txid;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

const transferSol = async (
    sol_connection,
    wallet,
    DESTINATION_WALLET,
    TRANSFER_AMOUNT,
    numberDecimals,
) => {
    try {
        const tx = new Transaction();
        tx.add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(DESTINATION_WALLET),
                lamports: Number(TRANSFER_AMOUNT * Math.pow(10, numberDecimals)).toFixed(0),
            }),
        );

        const latestBlockHash = await sol_connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = await latestBlockHash.blockhash;
        tx.feePayer = wallet.publicKey;

        const txid = await sendAndConfirmTransaction(sol_connection, tx, [wallet]);

        console.log(`https://solscan.io/tx/${txid}`);
        return txid;
    } catch (error) {
        console.log(' ------------');
        console.log('error:', error);
        console.log(' ------------');
        return false;
    }
};

module.exports = { swapSolana, transferToken, transferSol };
