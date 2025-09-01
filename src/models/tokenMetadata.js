const mongoose = require('mongoose');

const tokenMetadataSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    decimals: {
        type: Number,
        required: true,
    },
    icon: {
        type: String,
        required: false,
    },
    chain: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const TokenMetadata = mongoose.model('TokenMetadata', tokenMetadataSchema);

module.exports = TokenMetadata;