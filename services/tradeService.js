const samcoService = require('./samcoService');

exports.placeTrade = async (tradeDetails) => {
    // Fetch the best option
    const option = await samcoService.fetchOption();

    // Place the trade here
    // This is just a placeholder
    return { ...tradeDetails, option };
};