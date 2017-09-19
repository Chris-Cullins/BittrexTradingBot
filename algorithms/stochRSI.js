/**
 * Created by Chris on 9/16/2017.
 */
var technicals = require('../modules/technicals');
var config = require('../modules/config.json');

var coolDownMap = {};

/**
 * This function loops through an input array and looks for tickers with a 'MACD Power Cross' pattern, and returns an array of
 * tickers where the pattern was found.
 * @param ticker
 * @param input (candles)
 * @param log
 */
var checkForStochRSIEntry = function(ticker, input, log) {

    if (input[input.length - 1] === undefined ||
        input[input.length - 2] === undefined ||
        input[input.length - 3] === undefined ||
        input[input.length - 4] === undefined) {
        return false;
    }



    if (ticker !== undefined) {
        log.info('Checking for StochRSI Entry ' + ticker + '.');
        var high = [];
        var low = [];
        var close = [];
        var open = [];
        for (var i = 0; i < input.length; i++) {
            high.push(input[i].H);
            low.push(input[i].L);
            close.push(input[i].C);
            open.push(input[i].O);
        }


        var inputRSIHigh = {
            values: high,
            period: config.algorithmConfig.macdcross.rsiPeriod

        };

        var inputRSILow = {
            values: low,
            period: config.algorithmConfig.macdcross.rsiPeriod

        };

        var inputRSIClose = {
            values: close,
            period: config.algorithmConfig.macdcross.rsiPeriod
        };

        var rsiHigh = technicals.rsi(inputRSIHigh);
        var rsiLow = technicals.rsi(inputRSILow);
        var rsiClose = technicals.rsi(inputRSIClose);



        var stochastic = technicals.stoch(rsiHigh, rsiLow, rsiClose, config.algorithmConfig.macdcross.stochPeriod,
            config.algorithmConfig.macdcross.stochSignalPeriod);

        var shouldEnter = (stochastic[stochastic.length - 1].d < 20);

        if (shouldEnter) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

var checkForStochRSIExit = function(ticker, input, log) {

    if (input[input.length - 1] === undefined ||
        input[input.length - 2] === undefined ||
        input[input.length - 3] === undefined ||
        input[input.length - 4] === undefined) {
        return false;
    }


    if (ticker !== undefined) {
        log.info('Checking for StochRSI Exit ' + ticker + '.');
        var high = [];
        var low = [];
        var close = [];
        var open = [];
        for (var i = 0; i < input.length; i++) {
            high.push(input[i].H);
            low.push(input[i].L);
            close.push(input[i].C);
            open.push(input[i].O);
        }

        var inputRSIHigh = {
            values: high,
            period: config.algorithmConfig.macdcross.rsiPeriod

        };

        var inputRSILow = {
            values: low,
            period: config.algorithmConfig.macdcross.rsiPeriod

        };

        var inputRSIClose = {
            values: close,
            period: config.algorithmConfig.macdcross.rsiPeriod
        };

        var rsiHigh = technicals.rsi(inputRSIHigh);
        var rsiLow = technicals.rsi(inputRSILow);
        var rsiClose = technicals.rsi(inputRSIClose);



        var stochastic = technicals.stoch(rsiHigh, rsiLow, rsiClose, config.algorithmConfig.macdcross.stochPeriod,
            config.algorithmConfig.macdcross.stochSignalPeriod);

        var shouldExit = (stochastic[stochastic.length - 1].d > 80);

        if (shouldExit) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};



exports.checkForStochRSIEntry = checkForStochRSIEntry;
exports.checkForStochRSIExit = checkForStochRSIExit;