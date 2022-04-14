// go to https://www.binance.com/en/trade-rule to get specific config 
var configs = [];

configs[0] = {};
configs[0].enable              = true; // enable or disable this pair
configs[0].TICKER              = 'ETHBUSD';
configs[0].MAX_BUY_PRICE       = 5000;
configs[0].QUANTITY            = 0.01; // 0.01 ETH per trade. Note that total order must be equal or greater than Minimum Order Size, check https://www.binance.com/en/trade-rule for more information
configs[0].DOWN_STACK_PERCENT  = 2; // in % - add another trade if price goes down 2%
configs[0].MAX_STACK           = 10; // maximum number of trades we want to stack to minimize the risk/loss
configs[0].PROFIT_PERCENT      = 1; // in % - sell at 1% profit from the price we bought
configs[0].FEE_PERCENT         = 0.1; // in % - check your current fee tier on Binance
configs[0].BUY_SYMBOL_PROFIT_PERCENT = 70; // in % - take 70% profit in BUY_SYMBOL (spliting profit 30% in usd, 70% in ETH if using ETHBUSD pair)
configs[0].MIN_TICK_SIZE       = 0.0001; // Minimum Price Movement, check https://www.binance.com/en/trade-rule for Updating
configs[0].ROUND_PRICE = function (value) {
    R_TICK_SIZE = parseInt(1.0 / configs[0].MIN_TICK_SIZE)
    return Math.round(value * R_TICK_SIZE) / R_TICK_SIZE;
};
configs[0].MIN_TRADE_AMOUNT    = 0.0001; // Minimum Trade Amount, check https://www.binance.com/en/trade-rule for Updating
configs[0].ROUND_QUANTITY = function (value) {
    R_TRADE_AMOUNT = parseInt(1.0 / configs[0].MIN_TRADE_AMOUNT)
    return Math.round(value * R_TRADE_AMOUNT) / R_TRADE_AMOUNT;
};

module.exports = configs;