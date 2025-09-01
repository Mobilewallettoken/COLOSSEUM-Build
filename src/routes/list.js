const express = require('express');
const router = express.Router();
const TokenMetadata = require('../models/tokenMetadata');

/**
 * @swagger
 * /list/network:
 *   get:
 *     summary: Get the list of supported networks
 *     responses:
 *       200:
 *         description: A successful response with the list of networks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 networkList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                         example: 'SOL'
 *                       icon:
 *                         type: string
 *                         example: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png'
 *       500:
 *         description: Internal server error
 */
router.get('/network', async (_req, res) => {
    const networkList = [
        {
            symbol: 'SOL',
            icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
        },
        {
            symbol: 'BSC',
            icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
        },
        {
            symbol: 'BTC',
            icon: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1.png',
        },
    ];
    return res.status(200).json({ networkList: networkList });
});

/**
 * @swagger
 * /list/token:
 *   get:
 *     summary: Get the list of tokens
 *     responses:
 *       200:
 *         description: A successful response with the list of tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokenList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                         example: '0x1234567890abcdef1234567890abcdef12345678'
 *                       symbol:
 *                         type: string
 *                         example: 'SOL'
 *                       name:
 *                         type: string
 *                         example: 'Solana'
 *                       decimals:
 *                         type: integer
 *                         example: 18
 *                       icon:
 *                         type: string
 *                         example: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png'
 *                       chain:
 *                         type: string
 *                         example: 'SOL'
 *       500:
 *         description: Internal server error
 */
router.get('/token', async (_req, res) => {
    const tokens = await TokenMetadata.find();
    return res.status(200).json({ tokenList: tokens });
});

module.exports = router;
