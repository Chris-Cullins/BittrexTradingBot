/**
 * Created by Chris on 9/18/2017.
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
var checkForRSIEntry = function(ticker, input, log) {

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

        var inputRSIClose = {
            values: close,
            period: config.algorithmConfig.macdcross.rsiPeriod
        };

        var rsiClose = technicals.rsi(inputRSIClose);

        var macdInput = {
            values: close,
            fastPeriod: config.algorithmConfig.macdcross.fastPeriod,
            slowPeriod: config.algorithmConfig.macdcross.slowPeriod,
            signalPeriod: config.algorithmConfig.macdcross.signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        };

        var macddata = technicals.macd(macdInput);


        var hasMACDCross = lookForMACDCross(macddata, log);

        var rsiCross = lookForRSIEntryCross(rsiClose);

        //var shouldEnter = (hasMACDCross && rsiCross );

        var shouldEnter = (rsiCross );
        if (shouldEnter) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

var checkForRSIExit = function(ticker, input, log) {

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

        var inputRSIClose = {
            values: close,
            period: config.algorithmConfig.macdcross.rsiPeriod
        };

        var rsiClose = technicals.rsi(inputRSIClose);

        var macdInput = {
            values: close,
            fastPeriod: config.algorithmConfig.macdcross.fastPeriod,
            slowPeriod: config.algorithmConfig.macdcross.slowPeriod,
            signalPeriod: config.algorithmConfig.macdcross.signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        };

        var macddata = technicals.macd(macdInput);

        var rsiCross = lookForRSIExitCross(rsiClose);

        var shouldEnter = (rsiCross);

        if (shouldEnter) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }

};

var lookForRSIEntryCross = function(rsiData) {

    if (rsiData[rsiData.length - 1] === undefined ||
        rsiData[rsiData.length - 2] === undefined ||
        rsiData[rsiData.length - 3] === undefined ||
        rsiData[rsiData.length - 4] === undefined) {
        return false;
    }

    //did rsi just cross into above 30?
    var yesRSI = false;
    if (rsiData[rsiData.length - 1] > config.algorithmConfig.macdcross.rsiTreshholdBelow) {
        if (rsiData[rsiData.length - 2] <= config.algorithmConfig.macdcross.rsiTreshholdBelow ||
            rsiData[rsiData.length - 3] <= config.algorithmConfig.macdcross.rsiTreshholdBelow ||
            rsiData[rsiData.length - 4] <= config.algorithmConfig.macdcross.rsiTreshholdBelow) {
            yesRSI = true;
        }
    }

    return yesRSI;


};


var lookForRSIExitCross = function(rsiData) {

    if (rsiData[rsiData.length - 1] === undefined ||
        rsiData[rsiData.length - 2] === undefined ||
        rsiData[rsiData.length - 3] === undefined ||
        rsiData[rsiData.length - 4] === undefined) {
        return false;
    }

    var yesRSI = false;
    if (rsiData[rsiData.length - 1] > config.algorithmConfig.macdcross.rsiTreshholdAbove) {
        yesRSI = true;
    }

    return yesRSI;


};



var lookForMACDCross = function(macddata, log) {

    if (macddata[macddata.length - 1] === undefined ||
        macddata[macddata.length - 2] === undefined ||
        macddata[macddata.length - 3] === undefined ||
        macddata[macddata.length - 4] === undefined) {
        return false;
    }

    var yesMACDAboveSignal = false;
    var yesMACDPositive = false;

    if (macddata[macddata.length - 1].histogram > 0) {
        if (macddata[macddata.length - 2].histogram <= 0 ||
            macddata[macddata.length - 3].histogram <= 0 ||
            macddata[macddata.length - 4].histogram <= 0) {
            yesMACDPositive = true;
        }
    }
    if (macddata[macddata.length - 1].MACD > macddata[macddata.length - 1].signal) {
        if (macddata[macddata.length - 2].MACD <= macddata[macddata.length - 2].signal ||
            macddata[macddata.length - 3].MACD <= macddata[macddata.length - 3].signal ||
            macddata[macddata.length - 4].MACD <= macddata[macddata.length - 4].signal) {
            yesMACDAboveSignal = true;
        }
    }

    return (yesMACDAboveSignal && yesMACDPositive);

};


exports.checkForRSIEntry = checkForRSIEntry;
exports.checkForRSIExit = checkForRSIExit;