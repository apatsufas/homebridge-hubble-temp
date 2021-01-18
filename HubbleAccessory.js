const HubbleClient = require('./lib/hubble-client.js');
const packageJSON = require('./package.json');

module.exports = (Service, Characteristic, FakeGatoHistoryService) => class HubbleAccessory {

    constructor(log, config) {
        this.log = log;
        this.services = [];
        this.hubbleClient = new HubbleClient({
            host: config.host
        });
        // FakeGato
        this.fakeGateHistoryService = undefined;
        this.update_interval = Number(config["update_interval"] || 60);
        this.setup();
    }

    setup() {
        this.fakeGateHistoryService = new FakeGatoHistoryService('weather', this, {
            size: 4096, 				// optional - if you still need to specify the length
            storage: 'fs',
        });
        this.services = [
            this.accessoryInfo(),
            this.sensorService(),
            this.fakeGateHistoryService
        ]
    }

    getServices() {
        return this.services;
    }

    accessoryInfo() {
        const accessoryInfo = new Service.AccessoryInformation();

        accessoryInfo
            .setCharacteristic(Characteristic.Manufacturer, "HomeBridge")
            .setCharacteristic(Characteristic.Model, "Hubble Temperature Plugin")
            .setCharacteristic(Characteristic.FirmwareRevision, packageJSON.version)
            .setCharacteristic(Characteristic.Manufacturer, "HomeBridge")
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        return accessoryInfo;
    }

    sensorService() {
        let sensorService = new Service.TemperatureSensor("Hubble temperature");
        sensorService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                minValue: -50,
                maxValue: 50
            })
            .on('get', this.getCurrentTemperature.bind(this));

        setInterval(async () => {
            let value;
            try {
                value = await this.hubbleClient.getTemperature();
            } catch (e) {
                this.log.error(e.message);
                return;
            }
            this.log.info(`Temperature pollig result: ${value}°`);
            sensorService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .updateValue(value);
            this.addHistory(parseFloat(value));
        }, this.update_interval * 1000);

        return sensorService;
    }

    /**
         * Log the temperature to the FakeGato-service.
         * Only works if enableHistory is true and  pollingInterval > 0
         * @param temperature
         * @param humidity
         */
    addHistory(temperature) {
        this.fakeGateHistoryService.addEntry({
            time: Math.round(new Date().valueOf() / 1000),
            temp: temperature
        });
    }

    async getCurrentTemperature(callback) {
        try {
            const value = await this.hubbleClient.getTemperature();
            this.log.info(`Current temperature: ${value}°`);
            callback(null, value);
        } catch (e) {
            callback(e);
        }
    };
}