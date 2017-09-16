/**
 * Created by Chris on 9/15/2017.
 */
var config = require('./config.json');
var bittrex = require('./bittrexApi');
var mongoInterface = require('./mongoInterface');
var Log = require('log');
var fs = require('fs');
var utilities = require('./utilities');
var macdCross = require('../algorithms/macdcross');

var currentAccountBalance = 0 ;
var maxPositionSize = 0;
var maxPositionsTaken = 0;
var stopLoss = 0;

var tickersToTrade = config.traderConfig.tickersToTrade;

var setTickersToTrade = function(tickers) {
    tickersToTrade = tickers;
    return;
};

var setTradingParameters = function(callBack) {

    bittrex.getAccountBalance(function(data) {
        currentAccountBalance = data;

        maxPositionSize = config.traderConfig.maxPositionSize * currentAccountBalance;
        maxPositionsTaken = config.traderConfig.maxPositionsTaken * currentAccountBalance;
        stopLoss = config.traderConfig.stopLoss * currentAccountBalance;

        return callBack(true);

    })
};

var doScan = function(marketArray) {

    var logStoch = new Log('info', fs.createWriteStream('stoch.log'));

    var index = 0;
    doCandles(marketArray, index);


    function nextMarket(marketArray, index) {
        if (marketArray.length === index) {
            /*utilities.emailsForTripStoch(toTextArrayTripStoch);
            utilities.emailsForGenericAlgorithm(toTextArrayStochDivergence, "Stoch Diverge");
            utilities.emailsForGenericAlgorithm(toTextArrayMACD, "MACD Cross");*/
            index = 0;
        } else {

            doCandles(marketArray, index);
        }


    }
    function doCandles(marketArray, index) {
        utilities.wait(1000);

        bittrex.getCandles(marketArray[index], 'fiveMin', function(data) {

            mongoInterface.currentlyHasPosition(marketArray[index], function(posQuantity) {

                if (posQuantity === null) {
                    var hasMACDCross = macdCross.checkForMACDCrossEntry(marketArray[index], data, logStoch);

                    if (hasMACDCross) {

                        doEntryTrade(marketArray[index], data[data.length - 1].L, function (result) {
                            index++;
                            nextMarket(marketArray, index);
                        })
                    } else {
                        index++;
                        nextMarket(marketArray, index);
                    }
                } else {
                    // check for exit
                    var hasMACDCrossExit = macdCross.checkForMACDCrossExit(marketArray[index], data, logStoch);

                    if (hasMACDCrossExit) {
                        doExitTrade(marketArray[index], data[data.length - 1].L, posQuantity, function(result) {

                            index++;
                            nextMarket(marketArray, index);

                        });

                    } else {
                        index++;
                        nextMarket(marketArray, index);
                    }
                }
            });

        });
    }
};


function doEntryTrade(ticker, last, callBack) {

    //Here is where we would actually make the trade.

    var quantity = (maxPositionSize / last);

    mongoInterface.recordBuy(ticker, last, quantity, maxPositionSize, function(result) {
        return callBack(result) ;
    });
}


function doExitTrade(ticker, last, quantity, callback) {
    //Here is where we would actually make the trade.

    mongoInterface.recordSell(ticker, last, quantity, maxPositionSize, function(result) {
        return callback(result) ;
    });
}


exports.setTradingParameters = setTradingParameters;
exports.doScan = doScan;
exports.setTickersToTrade = setTickersToTrade;