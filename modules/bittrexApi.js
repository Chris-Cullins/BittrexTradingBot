var bittrex = require('node.bittrex.api');
var config = require('./api_settings.json');
var utilities = require('./utilities');

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
            return console.error(err);
        } else {
            var marketArray = [];
            for (var i in data.result) {
                marketArray.push(data.result[i].MarketName)
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
            return;
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


//exports.websocketsclient = websocketsclient;
exports.gettickers = gettickers;
exports.getMarketHistory = getMarketHistory;
exports.getCandlesCloses = getCandlesCloses;
exports.getAvaliableMarkets = getAvaliableMarkets;
exports.getCandles = getCandles;
exports.getAccountBalance = getAccountBalance;