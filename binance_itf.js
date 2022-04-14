
const binance = require('node-binance-api')().options({
    APIKEY: 'apikey',
    APISECRET: 'apisecret',
    useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
    recvWindow: 50000,
    test: false // If you want to use sandbox mode where orders are simulated
});

function get_lastest_price(ticker_name, cb) {
    binance.prices(ticker_name, (error, ticker) => {
        if (!error) {
            console.log("Price of BNB: ", ticker[ticker_name]);
            cb(null, ticker[ticker_name]);
        } else {
            cb(error, 0);
        }
    });
}

function get_top_buy_price(ticker_name, cb) {
    binance.bookTickers(ticker_name, (error, ticker) => {
        if (!error && ticker.symbol == ticker_name && ticker.bidPrice != null) {
            // console.log("Top Buy Price: ", ticker.bidPrice);
            cb(null, parseFloat(ticker.bidPrice));
        } else {
            cb('ERR: ' + error, 0);
        }        
    });
}

function buy(ticker_name, quantity, price, cb) { 

    binance.buy(ticker_name, quantity, roundCoin(price), {type:'LIMIT'}, (error, response) => {
        // console.log("Limit Buy response", response.msg);
        console.log("order id: " + response.orderId);
        if (error) {
            cb(error, 0);
        } else {
            cb(null, response.orderId);
        }
    });
}

function sell(ticker_name, quantity, price, cb) {
    binance.sell(ticker_name, quantity, roundCoin(price), {type:'LIMIT'}, (error, response) => {
        console.log("Limit Sell response", response);
        console.log("order id: " + response.orderId);
        if (error) {
            cb(error, 0);
        } else {
            cb(null, response.orderId);
        }
    });
}

function cancel_all_order(ticker_name, cb) {
    binance.cancelOrders(ticker_name, (error, response, symbol) => {
        console.log(symbol+" cancel response:", response);
        cb(error);
    });
}

function cancel_order(ticker_name, orderid, cb) {
    binance.cancel(ticker_name, orderid, (error, response, symbol) => {
        console.log(symbol+" cancel response:", response);
        cb(error, response.status === "CANCELED");
    });
}

function status_order(ticker_name, orderid, cb) {
    binance.orderStatus(ticker_name, orderid, (error, orderStatus, symbol) => {
        // console.log(symbol+" order status:", orderStatus);
        
        if (error) {
            cb(error, null, 0);
        } else {
            if (orderStatus.status === 'PARTIALLY_FILLED') {
                cb(null, orderStatus.status, parseFloat(orderStatus.executedQty));
            } else {
                cb(null, orderStatus.status, 0);
            }
        }
    });    
}

function roundCoin(value) {
    return Math.round(value * 100000000) / 100000000;
}

module.exports = {
    get_lastest_price,
    get_top_buy_price,
    buy,
    sell,
    cancel_all_order,
    cancel_order,
    status_order
}
