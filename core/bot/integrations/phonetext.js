var twilio      = require('twilio'),
    util        = require('util'),
    _           = require('underscore'),
    _s          = require('underscore.string'),
    debug       = require('debug')('Bender-Twilio Phonetext'),

    phrases     = require('../phrases'),
    config      = require('../../../config'),
    storage     = require('node-persist'),
    twilio      = new twilio.RestClient(config.twilioAccount, config.twilioToken),
    phonetext;

    storage.initSync();

phonetext = {

    sendText: function(text, number, callback) {
        if (!config.twilioNumber || !config.twilioAccount || !config.twilioToken) {
            debug('Twilio account information missing!');
            return callback('Hey, I\'ll need some Twilio config vars over here. This doesn\'t work without \'em.');
        }

        twilio.sendMessage({
            to: number,
            from: config.twilioNumber,
            body: text
        }, callback);
    },

    getNumber: function (name) {
        savedNumbers = storage.getItem('phonenumbers') || {};
        console.log(savedNumbers);
        return savedNumbers[name];
    },

    setNumber: function (query, callback) {
        var user, number, savedNumbers;

        if (_s.include(query, 'save phone number')) {
            query = _s.strRight(query, 'save phone number ');
            number = _s.strLeft(query, ' for');
            user = _s.strRight(query, 'for ');
        } else if (_s.include(query, '!savenumber')) {
            query = _s.strRight(query, '!savenumber ').split(' ');
            user = query[1];
            number = query[0];
        }

        console.log('Saving phone number ' + number + ' for ' + user);
        if (number && user) {
            savedNumbers = storage.getItem('phonenumbers') || {};
            savedNumbers[user] = number;

            storage.setItem('phonenumbers', savedNumbers);
            callback('Hey, I saved ' + number + ' for ' + user + '. We can now send that sucker texts and stuff.');
        }
        
    },

    ping: function (query, callback) {
        var message = '"It\'s me, Bender! Just so you know, the peepz in the Slack chat need you."';
        query = _s.strRight(query, 'ping ');
        this.text('text ' + query + ' ' + message, callback);
    },

    text: function (query, callback) {
        var text, number, self;

        text = query.match(/"(.+)"/)[1];
        query = _s.strRight(query, 'text ');
        number = _s.strLeft(query, ' "');

        if (/^[a-zA-Z]+$/.test(number)) {
            // Our number is in fact a name
            number = this.getNumber(number);
            if (!number) {
                return callback('Hey! I don\'t have a number for that guy! How do you want me to text him?');
            }
        }

        this.sendText(text, number, function (error, result) {
            var errorText;

            if (error) {
                debug('Twilio Error', util.inspect(error));
                return callback(error.message);
            }

            debug('Twilio Result', util.inspect(result));
            return callback(phrases.say('textsuccess'));
        });
        
    }

};

module.exports = phonetext;