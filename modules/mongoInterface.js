/**
 * Created by Chris on 9/15/2017.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var fs = require('fs');
var Log = require('log');
var utilities = require('./utilities');
var bittrexApi = require('./bittrexApi');

var log = new Log('info', fs.createWriteStream('profits.log', {'flags': 'a'}));

var url = 'mongodb://localhost:27017/bittrextradingbottest';
var curConnection = {};



var connect = function(callback) {

    MongoClient.connect(url, function(err, db) {
        curConnection = db;
        return callback(true);
    });
};

var disconnect = function(callback) {
    curConnection.close();
};

var recordBuy = function(ticker, last, quantity, btcValue, callback) {

        var buys = curConnection.collection('buys');
    var newbtcValue = parseFloat(btcValue).toFixed(8);
    var newQuantity = parseFloat(quantity).toFixed(8);
        buys.insertOne({ticker: ticker, price: last, quantity: newQuantity, btcValue: newbtcValue, date: new Date(), isCurrent: true}, function(err, result) {
            console.log('Buy was recorded! :' + ticker + ' - at ' + last + ' - ' + newQuantity + ' - ' + newbtcValue);
            callback(result);
        });


};

var recordSell = function(ticker, last, quantity, btcValue, callback) {


    var buys = curConnection.collection('buys');
    buys.findOneAndUpdate({ticker: ticker, isCurrent: true}, {$set: {isCurrent: false}}, function(err, result) {
        var sells = curConnection.collection('sells');
        var newbtcValue = (last * quantity * 0.9950).toFixed(8);
        var newQuantity = parseFloat(result.value.quantity).toFixed(8);
        sells.insertOne({ticker: ticker, price: last, quantity: newQuantity, btcValue: newbtcValue, date: new Date(), buyId: result.value._id}, function(err, sellResult) {
            console.log('Sell was recorded! :' + ticker + ' - at ' + last + ' - ' + newQuantity + ' - ' + newbtcValue);
            callback(sellResult);
        });
    });
};

var currentlyHasPosition = function(ticker, callback) {

    var buys = curConnection.collection('buys');
    buys.find({ticker: ticker, isCurrent: true}).toArray(function (err, docs) {
        if (err) {
            return callback(null);
        }
        if (docs !== null && docs.length !== 0) {
            return callback(docs[0].quantity);
        } else {
            return callback(null);
        }
    });

};

var determineProfitsOnPositions = function(positions, callback) {

    var profitsOnPositions = 0;

    doTicker(positions, 0);

    function nextMarket(positions, index) {
        if (positions.length === index) {
            index = 0;
            return callback(profitsOnPositions);
        } else {
            doTicker(positions, index);
        }


    }

    function doTicker(positions, index) {
        utilities.wait(1000);
        if (positions !== null && positions.length > 0) {
            bittrexApi.getticker(positions[index].ticker, function(result) {
                profitsOnPositions += ((positions[index].quantity * result.result.Last) - positions[index].btcValue) * 0.9950;

                index++;
                nextMarket(positions, index);
            });
        } else {
            return 0;
        }
    }


};

var getAllPositions = function(callback) {

    var buys = curConnection.collection('buys');
    buys.find({isCurrent: true}).toArray(function (err, docs) {

        if (err) {
            return callback(null);
        }

        if (docs !== null && docs.length !== 0) {
            return callback(docs);
        } else {
            return callback(null);
        }

    });
};


var determineCurrentProfits = function(callback) {


    var totalProfits = 0;

    var sells = curConnection.collection('sells');
    var buys = curConnection.collection('buys');
    sells.find({}).toArray(function(err, docs) {
        if (docs.length > 0) {
            doNextLookup(docs, 0);
            function nextSell(docs, index) {
                if (docs.length === index) {
                    log.info(totalProfits);
                    callback(totalProfits);
                    index = 0;
                } else {
                    doNextLookup(docs, index);
                }
            }

            function doNextLookup(docs, index) {
                var buyId = docs[index].buyId;
                buys.findOne({_id: buyId}, function (err, data) {
                    if (data !== null) {
                        totalProfits += docs[index].btcValue - data.btcValue;
                        index++;
                        nextSell(docs, index);
                    } else {
                        index++;
                        nextSell(docs, index);
                    }
                });
            }
        } else {
            return callback(totalProfits);
        }
    });

};

var syncOrderHistory = function(orderHistory, callback) {

    var orderHistoryCollection = curConnection.collection('order_history');
    orderHistoryCollection.insertMany(orderHistory.result, function(result) {
        callback(result);
    });

};


exports.recordBuy = recordBuy;
exports.recordSell = recordSell;
exports.currentlyHasPosition = currentlyHasPosition;
exports.determineCurrentProfits = determineCurrentProfits;
exports.connect = connect;
exports.getAllPositions = getAllPositions;
exports.disconnect = disconnect;
exports.determineProfitsOnPositions = determineProfitsOnPositions;
exports.syncOrderHistory = syncOrderHistory;