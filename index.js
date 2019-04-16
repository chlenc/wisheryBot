const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const frases = require('./assets/frases');
const bot = new TelegramBot(process.env.TOKEN, {polling: true});
const helpers = require('./assets/helpers');
const keyboards = require('./assets/keyboards');


bot.onText(/\/start/, (msg) => {

    helpers.addUser(msg.from);
    helpers.getUser(msg.chat.id).then(user => {
        if (user && user.phone_number) {
            bot.sendMessage(msg.chat.id, frases.settings_tags)
        } else {
            bot.sendMessage(msg.chat.id, frases.welcome_phone, keyboards.phone);
        }
    })

});

bot.on('message', function (msg) {
    var chatId = msg.chat.id;

    switch (true) {
        case (msg.contact):
            msg.contact.phone_number = ((msg.contact.phone_number[0] !== "+") ? '+' : '') + msg.contact.phone_number;
            helpers.updateUser(chatId, msg.contact);
            bot.sendMessage(msg.chat.id, frases.settings_tags)
            break;
    }
})


console.log('Bot has been started ✅ ');
