# Simple Binance Trading Bot

This trading bot simplifies your trades with some predefined configurations (e.g., profit, maximum price to buy, etc...). 

This repo does not come with any fancy trading algorithms, it just helps you reduce the stress to manage large amount of small trades. 

WE WILL NOT TAKE ANY RESPONSIBILITIES. PLEASE USE THE BOT AT YOUR OWN RISK ON COINS/TOKENS YOU REALLY BELIEVE IN.

## Setting up the bot

### Install Nodejs from [here](https://nodejs.org/en/download/)

### Clone this repo
```
    git clone https://github.com/LanyTek/SimpleBinanceTradeBot
```

### Install required libraries
```
    cd SimpleBinanceTradeBot
    npm install
```

### Create API keys on Binance for the bot

```
    Open Binance website https://www.binance.com and login into your account
```

Step 1: 
```
    Click "API Management" under your account setting
```
![](/images/step1.png)

Step 2, 3:
```
    Create "API Keys" by entering your chosen "API name" and click "Create API"
```
![](/images/step2.png)

Step 4,5,6,7:
```
    Step 4: Choose edit restrictions
    Step 5: Copy your "API key" and "Secret key" into binance_itf.js file (line 3 and 4)
    Step 6: Enable spot trading (otherwise the bot cannot make the trades)
    Step 7: This is optional but highly recommended. If you run this bot on the cloud, put your VM IP in "IP access restrictions". If your keys are somehow leaked, attackers cannot use them on any other machines. 
    Click "Save"
```
![](/images/step3.png)

### Configure the trade
Open "configs_stackbuy.js", there is an example to configure the bot to trade ETH/BUSD pair.

```
configs[0].TICKER              = 'ETHBUSD';
configs[0].MAX_BUY_PRICE       = 5000;
configs[0].QUANTITY            = 0.01; // 0.01 ETH per trade. Note that total order must be equal or greater than Minimum Order Size, check https://www.binance.com/en/trade-rule for more information
configs[0].DOWN_STACK_PERCENT  = 2; // in % - add another trade if price goes down 2%
configs[0].MAX_STACK           = 10; // maximum number of trades we want to stack to minimize the risk/loss
configs[0].PROFIT_PERCENT      = 1; // in % - sell at 1% profit from the price we bought
configs[0].FEE_PERCENT         = 0.1; // in % - check your current fee tier on Binance
configs[0].BUY_SYMBOL_PROFIT_PERCENT = 70; // in % - take 70% profit in BUY_SYMBOL (spliting profit 30% in usd, 70% in ETH if using ETHBUSD pair)

```

This example configures the bot: 
- to trade only if the price is less than 5000 BUSD (configs[0].MAX_BUY_PRICE = 5000),
- to buy 0.01 ETH per order (configs[0].QUANTITY = 0.01)
- after a buy was sucessfully performed, it will immediately submit a sell order with 1% profit (configs[0].PROFIT_PERCENT = 1)
- if price goes down 2% (configs[0].DOWN_STACK_PERCENT = 2) after we bought, we will submit another buy order to dollar-cost-average to the down-side until 10 buy orders are filled (configs[0].MAX_STACK = 10)
- if price goes up 0.1% after we set the buy order but it's not filled, we will cancel the order and submit a new one. In case we already bought at price X and the price goes down and then up, we only chase buy order up to the price X*(1-configs[0].DOWN_STACK_PERCENT).
- if the pair has exchange fee, when we buy at price X, we will sell at price X*(1+(configs[0].PROFIT_PERCENT + 2 * configs[0].FEE_PERCENT)) to guarantee the profit.
- we can also split the profit in 30% of usdc, 70% of eth (configs[0].BUY_SYMBOL_PROFIT_PERCENT = 70)

### NOTE: If your pair has trading fee, please have some BNB to cover the fee

### Run the bot
```
    cd SimpleBinanceTradeBot
    node index.js
```

## Support Us

- Please feel free to report bugs/issues/feedbacks to make this bot better.

- Features suggestion would be also welcome.

You **don't need to pay us or anyone** anything to use our software. But if you wanna buy us a cup of coffee, we will really appreciate your support
- ETH/BSC address: 0x44418AA66A0735ecdDd62c5234dF4141ddF32EE3
