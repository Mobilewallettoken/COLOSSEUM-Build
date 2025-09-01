const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    amountIn: {
        type: String,
        required: true,
    },
    amountOut: {
        type: String,
        required: true,
    },
    tokenAddress: {
        type: String,
        required: true,
    },
    fiatCurrencyCode: {
        type: String,
        required: true,
    },
    transactionType: {
        type: String,
        enum: ['buy', 'sell'],
        required: true,
    },
    swapHash: {
        type: String,
        default: '',
        required: false,
    },
    txhash: {
        type: String,
        default: '',
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'swapping'],
        default: 'pending',
        required: false,
    },
    userAddress: {
        type: String,
        default: '',
        required: false,
    },
    receiverAddress: {
        type: String,
        default: '',
        required: false,
    },
    gasFee: {
        type: Number,
        required: false,
    },
    count: {
        type: Number,
        required: false,
    },
    totalLocal: {
        type: Number,
        required: false,
    },
    totalUSD: {
        type: Number,
        required: false,
    },
    avgPrice: {
        type: String,
        required: true,
    },
    slippage: {
        type: String,
        required: false,
        default: '2.5%',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
