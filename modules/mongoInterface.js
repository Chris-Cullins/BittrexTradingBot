/**
 * Created by Chris on 9/15/2017.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var url = 'mongodb://localhost:27017/bittrextradingbottest';
var curConnection = {};

var connect = function(callback) {

    MongoClient.connect(url, function(err, db) {
        curConnection = db;
        return callback(true);
    });
};

var recordBuy = function(ticker, last, quantity, btcValue, callback) {

        var buys = curConnection.collection('buys');

        buys.insertOne({ticker: ticker, price: last, quantity: quantity, btcValue: btcValue, date: new Date(), isCurrent: true}, function(err, result) {
            console.log('Buy was recorded! :' + ticker + ' - at ' + last + ' - ' + quantity + ' - ' + btcValue);
            callback(result);
        });


};

var recordSell = function(ticker, last, quantity, btcValue, callback) {

    var buys = curConnection.collection('buys');
    buys.findOneAndUpdate({ticker: ticker, isCurrent: true}, {$set: {isCurrent: false}}, function(err, result) {
        var sells = curConnection.collection('sells');
        sells.insertOne({ticker: ticker, price: last, quantity: quantity, btcValue: btcValue, date: new Date(), buyId: result.value._id}, function(err, result) {
            console.log('Sell was recorded! :' + ticker + ' - at ' + last + ' - ' + quantity + ' - ' + btcValue);
            callback(result);
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

var determineCurrentProfits = function(callback) {


    var totalProfits = 0;

    var sells = curConnection.collection('sells');
    var buys = curConnection.collection('buys');
    sells.find({}).toArray(function(err, docs) {
        if (docs.length > 0) {
            doNextLookup(docs, 0);
            function nextSell(docs, index) {
                if (docs.length === index) {
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

exports.recordBuy = recordBuy;
exports.recordSell = recordSell;
exports.currentlyHasPosition = currentlyHasPosition;
exports.determineCurrentProfits = determineCurrentProfits;
exports.connect = connect;