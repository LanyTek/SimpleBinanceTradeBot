var binance = require('./binance_itf.js');
var db = require('./db_sql.js');
var configs = require('./configs_stackbuy.js');
var logger = require('./logger.js');

function run() {
    // console.log('RUN');

    for (let config of configs) {

        // check sell_order status
        check_sell_order_status(config);
        
        if (config.enable == false) {
            continue;
        }
        // get current buy order from db
        db.get_top_order(config.TICKER, function(err, top_order) {
            if (err) {
                console.log('get top buy ' + config.TICKER + ' err: ' + err);
            } else if (top_order == undefined) {
                // have no order, get top price and place order
                place_buy_order(config);
            } else {
                if (top_order.status === 'NEW') {
                    // check order filled or not
                    binance.status_order(config.TICKER, top_order.buyid, function(err, status, executedQty) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            if (status === 'NEW') {
                                // stack-buy if possible
                                // console.log('order is new');
                                upper_price(config, top_order);
                            } else if (status === 'FILLED') {
                                // buy order has been filled, place sell order
                                console.log(config.TICKER + ' buy order is filled');
                                place_sell_order(config, top_order.buyprice, top_order.buyid, top_order.buyquantity);
                                
                            } else if (status === 'PARTIALLY_FILLED') {
                                
                                process_partial_filled_buy(config, top_order, executedQty);                             
                                
                            } else {
                                // CANCELED PENDING_CANCEL (currently unused) REJECTED EXPIRED 
                                // consider remove this order if it is not partially filled.
                                // console.log('STATUS ORDER: ' + status); 
                                console.log('STATUS ORDER: ' + status);
                                db.remove_order(top_order.buyid, function(err) {

                                });
                               
                            }
                        }
                    });
                    
                } else if (top_order.status === 'SELLING') {
                    // is it neccessary to check if status selling but order sell has not been placed?
                    stack_buy(config, top_order);
                } else {
                    console.log('wrong data');
                }
                
            }
        });
    }
}

function place_buy_order(config) {
    console.log('place_buy_order ' + config.TICKER);
    
    db.get_number_order(config.TICKER, function(err, num_orders) {
        if (err) return;
        // check max stack
        if (num_orders > config.MAX_STACK) {
            return;
        }        

        binance.get_top_buy_price(config.TICKER, function(err, top_price) {
            if (!err) {
                if (top_price < config.MAX_BUY_PRICE) {
                    top_price += config.MIN_TICK_SIZE;
                    top_price = config.ROUND_PRICE(top_price);
                    var buyquantity = get_buy_quantity(config, top_price);  
                    console.log('buy order ' + config.TICKER + ' at price ' + top_price + ' quantity ' + buyquantity);
                    binance.buy(config.TICKER, buyquantity, top_price, function(err, orderID) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Placed order ' + config.TICKER + ' at price ' + top_price + ' orderID:' + orderID);
                            db.add_buy_order(orderID, config.TICKER, buyquantity, top_price, function(err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
                } else {
                    console.log('Dont buy ' + config.TICKER + ' at price: ' + top_price + '. Buying starts at ' + config.MAX_BUY_PRICE);
                }
            } else {
                console.log(err);
            }
        });        
    });
}

function place_sell_order(config, bought_price, orderidbuy, quantity) {
    var sell_price = bought_price * (1 + (config.PROFIT_PERCENT + config.FEE_PERCENT*2)*0.01 );
    sell_price = config.ROUND_PRICE(sell_price);
    console.log('Place sell ' + config.TICKER + ' order bought at ' + bought_price + ' sell at ' + sell_price);
    quantity = (1 - config.PROFIT_PERCENT / 100.0 * config.BUY_SYMBOL_PROFIT_PERCENT / 100.0) * quantity;
    quantity = config.ROUND_QUANTITY(quantity);
    binance.sell(config.TICKER, quantity, sell_price, function(err, orderID) {
        if (err) {
            console.log(err);
        } else {
            db.update_sell_order(orderID, quantity, sell_price, orderidbuy, function(err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
}

function stack_buy(config, top_order) {
    binance.get_top_buy_price(config.TICKER, function(err, top_price) {
        if (err) return;  
        
        if (top_price > config.MAX_BUY_PRICE) {
            return;
        }
        if (top_order.status !== 'SELLING') {
            return;
        }

        // if (top_price < top_order.buyprice * (1 - config.DOWN_STACK_PERCENT*0.01 - config.FEE_PERCENT*0.01)) {
        //     top_price += config.MIN_TICK_SIZE;
        //     top_price = config.ROUND_PRICE(top_price);
        // } else {
        //     top_price = top_order.buyprice * (1 - config.DOWN_STACK_PERCENT*0.01 - config.FEE_PERCENT*0.01);
        //     top_price = config.ROUND_PRICE(top_price);
        // }  

        if (top_price < top_order.buyprice * (1 - config.DOWN_STACK_PERCENT*0.01)) {
            top_price += config.MIN_TICK_SIZE;
            top_price = config.ROUND_PRICE(top_price);
        } else {
            top_price = top_order.buyprice * (1 - config.DOWN_STACK_PERCENT*0.01);
            top_price = config.ROUND_PRICE(top_price);
        } 
        
        db.get_number_order(config.TICKER, function(err, num_orders) {
            if (err) return;
            console.log(config.TICKER + " num_orders = " + num_orders);
            
            if (num_orders < config.MAX_STACK) {
                var buyquantity = get_buy_quantity(config, top_price);            
                console.log('Stack order ' + config.TICKER + ' at price ' + top_price + ' quantity ' + buyquantity);    
                binance.buy(config.TICKER, buyquantity, top_price, function(err, orderID) {
                    if (err) {
                        console.log(err);
                    } else {
                        db.add_buy_order(orderID, config.TICKER, buyquantity, top_price, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });               
               
            } else {
                // do nothing
                console.log('Stack ' + config.TICKER + ' is full');
                return;
            }
        });
        
    });    
}

function upper_price(config, top_order) {
    var UP_BUY_PERCENT = 0.1;
    binance.get_top_buy_price(config.TICKER, function(err, top_price) {
        if (err) return;
        
        top_price += config.MIN_TICK_SIZE;
        top_price = config.ROUND_PRICE(top_price);
        if (top_price > config.MAX_BUY_PRICE) {
            return;
        }
        
        if (top_price > top_order.buyprice * (1 + UP_BUY_PERCENT*0.01) ) {                       
            db.get_top_sell_order(config.TICKER, function(err, top_sell_order) {
                if (err) return;
                
                // if (top_sell_order != undefined && top_price > top_sell_order.sellprice*(1 - (config.DOWN_STACK_PERCENT*2*0.01 + config.FEE_PERCENT*2*0.01))) {
                //     top_price = top_sell_order.sellprice*(1 - (config.DOWN_STACK_PERCENT*2*0.01 + config.FEE_PERCENT*2*0.01));
                //     top_price = config.ROUND_PRICE(top_price);
                // }

                if (top_sell_order != undefined && top_price > top_sell_order.buyprice*(1 - config.DOWN_STACK_PERCENT*0.01)) {
                    top_price = top_sell_order.buyprice*(1 - config.DOWN_STACK_PERCENT*0.01);
                    top_price = config.ROUND_PRICE(top_price);
                }

                if (top_price <= top_order.buyprice * (1 + UP_BUY_PERCENT*0.01) ) {
                    return;
                }
                
                console.log('Cancel order ' + config.TICKER + ' at price ' + top_order.buyprice + ' buy new at price ' + top_price);
                binance.cancel_order(config.TICKER, top_order.buyid, function(err, is_cancelled) {
                    if (err) return;
                    if (is_cancelled) {
                        db.remove_order(top_order.buyid, function(err) {
                            if (err) return;
                            var buyquantity = get_buy_quantity(config, top_price);   
                            console.log('Upper to price ' + top_price + ' quantity ' + buyquantity); 
                            binance.buy(config.TICKER, buyquantity, top_price, function(err, orderID) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    db.add_buy_order(orderID, config.TICKER, buyquantity, top_price, function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            });
                        });
                    }
                });                
            });
        } 
    });    
}

function get_buy_quantity(config, buyprice) {
    if (config.RANGEBUY == undefined || config.RANGEBUY.length == 0) {
        return config.QUANTITY;
    }

    for (let range of config.RANGEBUY) {
        if (buyprice < range.lowerprice) {
            return config.ROUND_QUANTITY(config.QUANTITY * range.multiply);
        }
    }

    return config.QUANTITY;
}

function process_partial_filled_buy(config, top_order, executedQty) {

    binance.get_top_buy_price(config.TICKER, function(err, top_price) {
        if (err) return;

        // if price up 2x order price, cancel and place new buy order            
        if (top_order.buyprice * (1+config.DOWN_STACK_PERCENT*0.01*2) < top_price) {
            console.log('partial filled price ' + top_order.buyprice + ' cur price ' + top_price + '. Cancel and log into info.log');
            binance.cancel_order(config.TICKER, top_order.buyid, function(err, is_cancelled) {
                if (err) return;
                if (is_cancelled) {
                    // if quantity is enough for sell, place sell, if not, log to info log
                    // var sell_price = bought_price * (1 + (config.PROFIT_PERCENT + config.FEE_PERCENT*2)*0.01 );
                    // sell_price = config.ROUND_PRICE(sell_price);
                    // if (sellprice * executedQty > config.MIN_ORDER_SIZE) {
                    //     console.log('Place sell order bought at ' + bought_price + ' sell at ' + sell_price);
                    //     binance.sell(config.TICKER, executedQty, sell_price, function(err, orderID) {
                    //         if (err) {
                    //             console.log(err);
                    //         } else {
                    //             db.update_sell_order(orderID, executedQty, sell_price, top_order.buyid, function(err) {
                    //                 if (err) {
                    //                     console.log(err);
                    //                 }
                    //             });
                    //         }
                    //     });
                    // } else {
                    //     db.remove_order(top_order.buyid, function(err) {
                    //         if (err) {
                    //             console.log(err);
                    //         } else {
                    //             logger.info_log('PARTIAL FILL', config.TICKER + ' buy order is partial filled at price ' + top_order.buyprice + ' with executedQty: ' + executedQty);
                    //         }
                    //     }); 
                    // }

                    db.remove_order(top_order.buyid, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            logger.info_log('PARTIAL FILL', config.TICKER + ' buy order is partial filled at price ' + top_order.buyprice + ' with executedQty: ' + executedQty);
                        }
                    }); 
                }
            }); 

        } else {
            // do nothing, just wait for full filled
            console.log('partial filled price ' + top_order.buyprice + ' cur price ' + top_price + '. not yet cancel');
        }
    });
    
}

function check_sell_order_status(config) {
    db.get_top_sell_order(config.TICKER, function(err, sell_order) {
        if (!err && sell_order != undefined) {
            binance.status_order(config.TICKER, sell_order.sellid, function(err, status, executedQty) {
                // console.log('Sell order ' + config.TICKER + ' at price ' + sell_order.sellprice + ' ' + status);
                if (err) {
                    console.log(err);
                    return;
                } else {
                    if (status !== 'NEW' && status !== 'PARTIALLY_FILLED' && status != undefined) {                       
                        // sell order has been filled, or canceled
                        console.log('Sell order ' + config.TICKER + ' at price ' + sell_order.sellprice + ' is Filled or canceled');
                        
                        if (status === 'FILLED') {
                            logger.debug_log('Sell order ' + config.TICKER + ' at price ' + sell_order.sellprice + ' quantity ' + sell_order.sellquantity + ' is Filled');
                        }
                        
                        db.remove_order(sell_order.buyid, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });                        
                    }
                }
            });
        } else if (err) {    
            console.log(err);
        }
    });  
}

module.exports = {
    run,
}
