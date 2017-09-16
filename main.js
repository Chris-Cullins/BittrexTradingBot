/**
 * Created by Chris on 9/4/2017.
 */
var fs = require('fs');
var Log = require('log');
var config = require('./modules/config.json');
var trader = require('./modules/trader');
var mongoInterface = require('./modules/mongoInterface');
var bittrexAPI = require('./modules/bittrexApi');

var log = new Log('info', fs.createWriteStream('main.log'));


bittrexAPI.getAvaliableMarkets(function (returned) {
    var marketArray = [];
    for (var i = 0; i < returned.length; i++) {
        if (returned[i] !== undefined) {
            if (returned[i].substring(0, 4) === 'BTC-') {
                marketArray.push(returned[i]);
            }
        }
    }
    //trader.setTickersToTrade(marketArray);
    setInterval(function() {

         mongoInterface.connect(function (result) {
             trader.setTradingParameters(function (result) {

                 mongoInterface.determineCurrentProfits(function (result) {
                     trader.doScan(marketArray);
                     console.log('Current profits - ' + result);
                 });
             });
        });
    }, config.mainSettings.intervalBetweenScans);

});
