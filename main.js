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

    //var marketArray = config.traderConfig.tickersToTrade;

    mongoInterface.connect(function (result) {
        //mongoInterface.getAllPositions(function(result) {

            //mongoInterface.determineProfitsOnPositions(result, function (profitsOnPos) {
                //console.log('Profits on positions - ' + profitsOnPos);

                //bittrexAPI.syncOrderHistory(function(done) {
                    //console.log(done);

                    setInterval(function() {
                        trader.setTradingParameters(function (result) {
                            console.log(result);
                            mongoInterface.determineCurrentProfits(function (result) {
                                //trader.addToAccountBalance(result, function (done) {
                                    trader.doScan(marketArray);
                                    console.log('Current profits - ' + result);
                                //});
                            });
                        });

                    }, config.mainSettings.intervalBetweenScans);
                //});
            //});
        //});
    });
});