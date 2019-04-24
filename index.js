const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const frases = require('./assets/frases');
const bot = new TelegramBot(process.env.TOKEN, {polling: true});
const helpers = require('./assets/helpers');
const keyboards = require('./assets/keyboards');
const kb = require('./assets/keyboard-buttons');
const cache = require('memory-cache');
const tags = require('./assets/tags').tags;


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


bot.on('message', (msg) => {
    try {
        const chatId = msg.chat.id;
        let cacheData = cache.get(chatId);
        console.log(cacheData)
        if (msg.contact) {
            msg.contact.phone_number = ((msg.contact.phone_number[0] !== "+") ? '+' : '') + msg.contact.phone_number;
            helpers.updateUser(chatId, msg.contact);
            const selectedTags = tags.map(({code}) => code);
            bot.sendMessage(chatId, frases.settings_tags, keyboards.tags(selectedTags,'SETTINGS'));
            cache.put(chatId, {payload: {selectedTags}, state: 'TAGS', flag:'SETTINGS'});
        } else if (msg.text === kb.home.add) {
            cache.put(chatId, {payload: {}, state: 'ADD_TITLE'});
            bot.sendMessage(chatId, frases.add_title)
        } else if (msg.text === kb.home.search) {
            bot.sendMessage(chatId, frases.develop)
        } else if (msg.text === kb.home.feedback) {
            bot.sendMessage(chatId, frases.develop)
        } else if (msg.text === kb.home.settings) {
            helpers.getUser(chatId).then(user => {
                const selectedTags = user.tags || [];
                bot.sendMessage(chatId, frases.settings_tags, keyboards.tags(selectedTags, 'SETTINGS'));
                cache.put(chatId, {payload: {selectedTags}, state: 'TAGS', flag:'SETTINGS'});

            })
        } else if (msg.text === kb.home.myMatches) {
            bot.sendMessage(chatId, frases.develop)
        } else if (msg.text === kb.home.share) {
            bot.sendMessage(chatId, frases.develop)
        } else if (cacheData != null) {
            switch (cacheData.state) {
                case 'ADD_TITLE':
                    cache.put(chatId, {payload: {title: msg.text}, state: 'ADD_TIME'});
                    cache.put(chatId, {payload: {title: msg.text}, state: 'ADD_TIME'});
                    bot.sendMessage(chatId, frases.add_time, keyboards.add_time());
                    break;

            }
        }
    } catch (e) {
        console.error(e)
    }
});


bot.on('callback_query', function (query) {
    const {chat, message_id} = query.message;
    let cacheData = cache.get(chat.id);
    console.log(query.data)
    try {

        if (query.data === 'SUBMIT_TAGS_SETTINGS') {
            helpers.updateUser(chat.id, {tags: cacheData.payload.selectedTags});
            bot.sendMessage(chat.id, frases.success_tags, keyboards.home);
            bot.deleteMessage(chat.id, message_id);
            cache.del(chat.id);
        }else if(query.data === 'SUBMIT_TAGS_ADD'){
            console.log(cacheData.payload)
            cache.put(chat.id, {payload: {...cacheData.payload, time: query.data}, state: 'ADD_PIC'});
            bot.deleteMessage(chat.id, message_id);
            //todo add match
        } else if (cacheData != null) {
            switch (cacheData.state) {
                case 'TAGS':
                    if (!Array.isArray(cacheData.payload.selectedTags)) cacheData.payload.selectedTags = [];
                    const index = cacheData.payload.selectedTags.indexOf(query.data);
                    index === -1
                        ? cacheData.payload.selectedTags.push(query.data)
                        : cacheData.payload.selectedTags.splice(index, 1);

                    bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags(cacheData.payload.selectedTags, cacheData.flag));
                    bot.deleteMessage(chat.id, message_id);
                    cache.put(chat.id, cacheData);
                    break;
                case 'ADD_TIME':
                    cache.put(chat.id, {payload: {...cacheData.payload, time: query.data}, state: 'TAGS', flag:'ADD'});
                    bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags([], 'ADD'));
                    break;
            }
        }
    } catch (e) {
        console.log(e)
    }

})
//
// bot.on('message', function (msg) {
//     const chatId = msg.chat.id;
//     let cache = cache.get(chatId);
//
//     bot.sendMessage(chatId, 'text', {
//         reply_markup: JSON.stringify({
//             inline_keyboard: [
//                 [{ text: 'Кнопка 1', callback_data: '1' }],
//                 [{ text: 'Кнопка 2', callback_data: 'data 2' }],
//                 [{ text: 'Кнопка 3', callback_data: 'text 3' }]
//             ]
//         })
//     })
//     //
//     // bot.sendMessage(msg.chat.id, frases.settings_tags, {
//     //     reply_markup: JSON.stringify({
//     //         inline_keyboard: [
//     //             [{
//     //                 text: 'Связаться',
//     //                 callback_data: 'callback'
//     //             }]
//     //         ]
//     //     })
//     // });
//
//
//
// })


console.log('Bot has been started ✅ ');
