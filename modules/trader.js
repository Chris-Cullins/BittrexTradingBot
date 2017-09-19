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
var stochCross = require('../algorithms/stochRSI');
var rsiCross = require('../algorithms/rsiCross');

var currentAccountBalance = 0 ;
var maxPositionSize = 0;
var maxPositionsTaken = 0;
var stopLoss = 0;

var tickersToTrade = config.traderConfig.tickersToTrade;

var setTickersToTrade = function(tickers) {
    tickersToTrade = tickers;
    return;
};

var addToAccountBalance = function(amount, callback) {
    currentAccountBalance += amount;

    maxPositionSize = config.traderConfig.maxPositionSize * currentAccountBalance;
    maxPositionsTaken = config.traderConfig.maxPositionsTaken * currentAccountBalance;
    stopLoss = config.traderConfig.stopLoss * currentAccountBalance;

    callback(true);
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
            return;
        } else {

            doCandles(marketArray, index);
        }


    }
    function doCandles(marketArray, index) {
        utilities.wait(1000);

        bittrex.getCandles(marketArray[index], 'thirtyMin', function(data) {

            mongoInterface.currentlyHasPosition(marketArray[index], function(posQuantity) {

                if (posQuantity === null) {
                    //var hasMACDCross = macdCross.checkForMACDCrossEntry(marketArray[index], data, logStoch);

                   // var hasStochCross = stochCross.checkForStochRSIEntry(marketArray[index], data, logStoch);


                    var hasRSIEntry = rsiCross.checkForRSIEntry(marketArray[index], data, logStoch);

                    if (hasRSIEntry) {

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
                    //var hasMACDCrossExit = macdCross.checkForMACDCrossExit(marketArray[index], data, logStoch);


                   // var hasStochExit = stochCross.checkForStochRSIExit(marketArray[index], data, logStoch);

                    var hasRSIExit = hasRSIEntry.checkForRSIExit(marketArray[index], data, logStoch);

                    if (hasRSIExit) {

                   // if (hasMACDCrossExit) {
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


    mongoInterface.getAllPositions(function(result) {

        var totalCurPos = 0;
        if (result !== null && result.length > 0) {
            for (var i = 0; i < result.length; i++) {
                totalCurPos += parseFloat(result[i].btcValue);
            }
        }

        if (totalCurPos < maxPositionsTaken) {

            bittrex.getticker(ticker, function(tickLast) {
                var curPrice = tickLast.result.Last;
                var quantity = (maxPositionSize / curPrice);

                if (config.PRODUCTION_MODE) {
                    //Here is where we would actually make the trade.
                    bittrex.placeBuyOrderLimit(ticker, quantity, curPrice, function(result) {
                        return callBack(result);
                    });

                } else {
                    mongoInterface.recordBuy(ticker, curPrice, quantity, maxPositionSize, function (data) {
                        return callBack(data);
                    });
                }
            });

        } else {
            console.log('I wanted to buy ' + ticker + ' but I\'m maxed on positions! I currently have ' + totalCurPos + ' .');
            callBack(false);
        }

    });

}


function doExitTrade(ticker, last, quantity, callback) {


    if (config.PRODUCTION_MODE) {
        //Here is where we would actually make the trade.

        bittrex.getticker(ticker, function(tickLast) {
            var curPrice = tickLast.result.Last;
            bittrex.placeSellOrderLimit(ticker, quantity, curPrice, function (result) {
                return callback(result);
            });
        });
    } else {

        mongoInterface.recordSell(ticker, last, quantity, maxPositionSize, function (result) {
            return callback(result);
        });
    }
}


exports.setTradingParameters = setTradingParameters;
exports.doScan = doScan;
exports.setTickersToTrade = setTickersToTrade;
exports.addToAccountBalance = addToAccountBalance;