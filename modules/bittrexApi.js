var bittrex = require('node.bittrex.api');
var config = require('./api_settings_prod.json');
var utilities = require('./utilities');
var mongoInterface = require('./mongoInterface');

bittrex.options({
    'apikey': config.api_key,
    'apisecret': config.api_secret
});


var getAccountBalance = function(callbackfinal) {
    bittrex.getbalances( function( data, err ) {
        var results = data.result;
        var nonZeroBalances = [];
        results.forEach(function(result, index) {
            if (result.Balance !== 0) {
                nonZeroBalances.push(result);
            }
        });

        var totalBalanceInBTC = 0;
        var numberOfCalls = nonZeroBalances.length;

        var index = 0;
        doTicker(nonZeroBalances, index);

        function nextTicker(nonZeroBalances, index) {
            if (nonZeroBalances.length === index) {
                console.log(totalBalanceInBTC);
                return callbackfinal(totalBalanceInBTC);
            } else {
                doTicker(nonZeroBalances, index);
            }

        }
        function doTicker(nonZeroBalances, index) {
            utilities.wait(1000);
            if (nonZeroBalances[index].Currency !== 'BTC') {
                var marketString = 'BTC-' + nonZeroBalances[index].Currency;
                getticker(marketString, function (result) {
                    numberOfCalls--;
                    if (result !== null) {
                        totalBalanceInBTC += (nonZeroBalances[index].Balance * result.result.Last);
                        console.log(nonZeroBalances[index].Currency + ' - ' + result.result.Last);
                    } else {
                        console.log('Ticker ' + nonZeroBalances[index].Currency + ' was null!');
                    }


                    index++;
                    nextTicker(nonZeroBalances, index);

                });
            } else {
                totalBalanceInBTC += nonZeroBalances[index].Balance;
                index++;
                nextTicker(nonZeroBalances, index);
            }
        };
    });
};

var getticker = function(coin, callback) {
    var url = 'https://bittrex.com/api/v1.1/public/getticker?market=' + coin;
    bittrex.sendCustomRequest( url, function( data, err ) {
        return callback(data);
    });
};

var gettickers = function() {
    var data = [];
    for (index = 0; index < coins.coin_list.length; index++) {
        data.push(getticker(coins.coin_list[index]));
    }

    return data;
};

var getMarketHistory = function() {
    bittrex.getmarkethistory({market: 'BTC-NEO'}, function (data, err) {
        console.log(data);

    })
};

var getAvaliableMarkets = function(callback) {
    bittrex.getmarketsummaries(function(data, err) {
        if (err) {
            console.error(err);
            return callback([]);
        } else {
            var marketArray = [];
            for (var i in data.result) {
                if (data.result[i].BaseVolume > 50) {
                    marketArray.push(data.result[i].MarketName)
                }
            }
            return callback(marketArray);
        }
    })
};


var getCandlesCloses = function (marketName, tickInterval, callback) {
    bittrex.getcandles({
        marketName: marketName,
        tickInterval: tickInterval // intervals are keywords
    }, function (data, err) {
        //console.log(data);
        var closes = [];
        if (data !== null) {
            for (var i = 0; i < data.result.length; i++) {
                closes.push(data.result[i].C);
            }
            return callback(closes);
        } else {
            return callback([]);
        }

    });
};

var getCandles = function( marketName, tickInterval, callback) {
    bittrex.getcandles({
        marketName: marketName,
        tickInterval: tickInterval // intervals are keywords
    }, function (data, err) {
        //console.log(data);
        if (err) {
            console.log(err);
            return callback([]);
        }
        var returnArray = [];
        if (data !== null) {
            for (var i = 0; i < data.result.length; i++) {
                returnArray.push(data.result[i]);
            }
            return callback(returnArray);
        } else {
            return callback([]);
        }

    });
};

function bittrexPublicRequestJustURI(command){
    var uri = command;
    var response = UrlFetchApp.fetch(uri);
    var dataAll = JSON.parse(response.getContentText());
    if (dataAll.success = true) {
        return dataAll.result
    } else {
        return dataAll.message
    }
}

var placeBuyOrderLimit = function(ticker, orderQuantity, rate, callback) {


    var buyParams = {
        market: ticker,
        quantity: orderQuantity.toFixed(8),
        rate: rate
    };

    bittrex.buylimit(buyParams, function(result) {
        if (result !== null && result.success === true) {

            var btcValue = orderQuantity * rate;
            var newOrderQuantity = parseFloat(orderQuantity).toFixed(8);

            mongoInterface.recordBuy(ticker, rate,newOrderQuantity, btcValue.toFixed(8), function(dbResult) {
                callback(dbResult);
            });
        } else {
            console.log(result);
        }
    });
};

var placeSellOrderLimit = function(ticker, orderQuantity, rate, callback) {

    //var newOrderQuantity = (orderQuantity * 0.9975).toFixed(8);
    var sellParams = {
        market: ticker,
        quantity: orderQuantity.toFixed(8),
        rate: rate
    };

    bittrex.selllimit(sellParams, function(result) {
        if (result.success === true) {
            var btcValue = orderQuantity * rate;
            mongoInterface.recordSell(ticker, rate, orderQuantity.toFixed(8), btcValue.toFixed(8), function(dbResult) {
                callback(dbResult);
            });
        }
    });
};

var placeSellOrderMarket = function(ticker, orderQuantity, rate, callback) {

    //var newOrderQuantity = (orderQuantity * 0.9975).toFixed(8);
    var sellParams = {
        market: ticker,
        quantity: orderQuantity.toFixed(8)
    };

    bittrex.sellmarket(sellParams, function(err, result) {
        if (result.success === true) {
            var btcValue = orderQuantity * rate;
            mongoInterface.recordSell(ticker, rate, orderQuantity.toFixed(8), btcValue.toFixed(8), function(dbResult) {
                callback(dbResult);
            });
        }
    });
};

var syncOrderHistory = function(callback) {
    bittrex.getorderhistory({}, function(result) {
        mongoInterface.syncOrderHistory((result), function(dbResult) {
            callback(dbResult);
        });
    });
};

//exports.websocketsclient = websocketsclient;
exports.gettickers = gettickers;
exports.getticker = getticker;
exports.getMarketHistory = getMarketHistory;
exports.getCandlesCloses = getCandlesCloses;
exports.getAvaliableMarkets = getAvaliableMarkets;
exports.getCandles = getCandles;
exports.getAccountBalance = getAccountBalance;
exports.placeBuyOrderLimit = placeBuyOrderLimit;
exports.placeSellOrderLimit = placeSellOrderLimit;
exports.syncOrderHistory = syncOrderHistory;
exports.placeSellOrderMarket = placeSellOrderMarket;