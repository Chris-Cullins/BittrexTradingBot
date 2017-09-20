/**
 * Created by Chris on 9/17/2017.
 */
/*
 exports.gettickers = gettickers;
 exports.getticker = getticker;
 exports.getMarketHistory = getMarketHistory;
 exports.getCandlesCloses = getCandlesCloses;
 exports.getAvaliableMarkets = getAvaliableMarkets;
 exports.getCandles = getCandles;
 exports.getAccountBalance = getAccountBalance;
 exports.placeBuyOrderMarket = placeBuyOrderMarket;
 exports.placeSellOrderMarket = placeSellOrderMarket;
 exports.syncOrderHistory = syncOrderHistory;

 */

var bittrexApi = require('../modules/bittrexApi');


var testPlaceBuyOrderMarket = function() {


    var ticker = 'BTC-XVG';
    var orderQuantity = 2000.43396226;
    var rate = 0.00000100;

    bittrexApi.placeBuyOrderLimit(ticker, orderQuantity, rate, function(result) {
        //console.log(result);
    });


}



var testPlaceSellOrderLimit = function() {

    var ticker = 'BTC-XVG';
    var orderQuantity = 2509.43396226;
    var rate = 0.00000200;

    bittrexApi.placeSellOrderLimit(ticker, orderQuantity, rate, function(result) {
        console.log(result);
    });


};

var testPlaceSellOrderMarket = function() {
    var ticker = 'BTC-MTL';
    var orderQuantity = 1.59599362;
    var rate = 0.00247638;

    bittrexApi.placeSellOrderMarket(ticker, orderQuantity, rate, function(result) {
        console.log(result);
    });

}


var testStopOrder = function() {

    var ticker = 'BTC-BAT';
    var orderQuantity = 73.69782047;
    var rate = 0.00007480;

    bittrexApi.placeSellStopOrderLimit(ticker, orderQuantity, rate, function(result) {

        console.log(result);

        bittrexApi.getOpenOrders(ticker);
    });

}
exports.testPlaceSellOrderLimit = testPlaceSellOrderLimit;
exports.testPlaceSellOrderMarket = testPlaceSellOrderMarket;
exports.testPlaceBuyOrderMarket = testPlaceBuyOrderMarket;
exports.testStopOrder = testStopOrder;