var bittrexAPI_test = require('./bittrexAPI_test');
var mongoInterface = require('../modules/mongoInterface');



mongoInterface.connect(function(result) {

    console.log(result);
    bittrexAPI_test.testStopOrder();


});
//bittrexAPI_test.testPlaceSellOrderMarket();