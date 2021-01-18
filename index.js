const HubbleAccessory = require('./HubbleAccessory');

module.exports = function(homebridge) {          
    ({ Service, Characteristic } = homebridge.hap);
    // History service
    FakeGatoHistoryService = require("fakegato-history")(homebridge);
    homebridge.registerAccessory(
        'homebridge-hubble-temp', 
        'HubbleCameraTemp', 
        HubbleAccessory(Service, Characteristic, FakeGatoHistoryService)
    );
}