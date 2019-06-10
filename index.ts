import * as TelegramBot from 'node-telegram-bot-api';

require('dotenv').config();

const frases = require('./assets/frases');
const bot = new TelegramBot(process.env.TOKEN, {polling: true});
const helpers = require('./assets/helpers');
const keyboards = require('./assets/keyboards');
const kb = require('./assets/keyboard-buttons');
const cache = require('memory-cache');
const tagsList = require('./assets/tags').tags;


bot.onText(/\/start/, (msg) => {
    helpers.updateUser(msg.chat.id, msg.from);
    helpers.getUser(msg.chat.id).then(user => {
        if (user && user.phone_number) {
            const tags = tagsList.map(({code}) => code);
            bot.sendMessage(msg.chat.id, frases.settings_tags, keyboards.tags(tags, 'TAGS'))
                .catch(e => console.error(e))
            cache.put(msg.chat.id, {payload: {tags}, state: 'SETTINGS'});
        } else {
            bot.sendMessage(msg.chat.id, frases.welcome_phone, keyboards.phone).catch(e => console.error(e));
        }
    })
});

bot.onText(/\/home/, (msg) => {

    helpers.getUser(msg.chat.id).then(user => {
        if (user && user.phone_number) {
            bot.sendMessage(msg.chat.id, frases.welcome_phone, keyboards.home)
        } else {
            bot.sendMessage(msg.chat.id, frases.welcome_phone, keyboards.phone);
        }
    })

});


bot.on('message', (msg) => {
    try {
        const chatId = msg.chat.id;
        let cacheData = cache.get(chatId);

        if (msg.contact) {
            msg.contact.phone_number = ((msg.contact.phone_number[0] !== "+") ? '+' : '') + msg.contact.phone_number;
            helpers.updateUser(chatId, msg.contact);
            const tags = tagsList.map(({code}) => code);
            bot.sendMessage(chatId, frases.settings_tags, keyboards.tags(tags, 'TAGS'));
            cache.put(chatId, {payload: {tags}, state: 'SETTINGS'});
        }
        // else if (msg.text === kb.home.add) {
        //     cache.put(chatId, {payload: {}, state: 'ADD_TITLE'});
        //     bot.sendMessage(chatId, frases.add_title)
        // } else if (msg.text === kb.home.search) {//todo
        //     helpers.getWishes(chatId).then(wishes => {
        //         helpers.getUser(chatId).then(user => {
        //             wishes = wishes.filter(({tags}) => {
        //                 for (let i in tags) {
        //                     if (user.tags.indexOf(tags[i]) !== -1) return true
        //                 }
        //                 return false;
        //             });
        //
        //             for (let i = 0; i < wishes.length; i++) {
        //              // ({
        //              //     text: (i+1)+'',
        //              //     callback_data: 'SUBMIT_TAGS_' + flag
        //              // })
        //             }
        //
        //         })
        //     });
        //     bot.sendMessage(chatId, frases.develop)
        // } else if (msg.text === kb.home.feedback) { //todo
        //     bot.sendMessage(chatId, frases.develop)
        // } else if (msg.text === kb.home.settings) {
        //     helpers.getUser(chatId).then(user => {
        //         const selectedTags = user.tags || [];
        //         bot.sendMessage(chatId, frases.settings_tags, keyboards.tags(selectedTags, 'SETTINGS'));
        //         cache.put(chatId, {payload: {selectedTags}, state: 'TAGS', flag: 'SETTINGS'});
        //
        //     })
        // } else if (msg.text === kb.home.myMatches) {
        //     helpers.getWishes(chatId).then(data => {
        //         console.log(data)
        //         const text = 'Список:\n\n'+Object.keys(data).map(wish => `${data[wish].title} ${data[wish].time}`).join('\n');
        //         console.log(text)
        //         bot.sendMessage(chatId, text, keyboards.home)
        //     })
        // } else if (msg.text === kb.home.share) { //todo
        //     bot.sendMessage(chatId, frases.develop)
        // } else
        if (cacheData != null) {
            switch (cacheData.state) {
                case 'ADD_TITLE':
                    cache.put(chatId, {payload: {title: msg.text}, state: 'ADD_TIME'});
                    bot.sendMessage(chatId, frases.add_time, keyboards.add_time()).catch(e => console.error(e));
                    break;

            }
        }
    } catch (e) {
        console.error(e)
    }
});


bot.on('callback_query', function (query) {
    try {
        const chat = query.message.chat;
        const message_id = query.message.message_id + '';;
        const cacheData = cache.get(chat.id);

        console.log(query.data);
        console.log(cacheData);

        const data = helpers.unmarshal(query.data);


        switch (data.state) {
            case 'TAGS':
                const tags = Array.isArray(cacheData.payload.tags) ? cacheData.payload.tags : [];
                const index = tags.indexOf(data.payload);
                index === -1 ? tags.push(data.payload) : tags.splice(index, 1);

                bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags(tags, data.state))
                    .then(() => bot.deleteMessage(chat.id, message_id));
                cache.put(chat.id, {state: cacheData.state, payload: {...cacheData.payload, tags}});
                break;
            case 'SUBMIT_TAGS':
                if (cacheData.state === 'SETTINGS') {
                    helpers.updateUser(chat.id, {tags: cacheData.payload.tags});
                    bot.sendMessage(chat.id, frases.success_tags, keyboards.home)
                        .then(() => bot.deleteMessage(chat.id, message_id));
                    cache.del(chat.id);
                } else if (cacheData.state === 'ADD') {
                    helpers.addWish({...cacheData.payload, user_id: chat.id});
                    cache.del(chat.id);
                    bot.sendMessage(chat.id, frases.add_success, keyboards.home)
                        .then(() => bot.deleteMessage(chat.id, message_id));
                }
                break;



            //===========ADD==============\\
            case 'ADD_TIME':
                cache.put(chat.id, {payload: {...cacheData.payload, time: data.payload}, state: 'ADD'});

                bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags([], 'TAGS'))
                    .then(() => bot.deleteMessage(chat.id, message_id));
                break;
            //===========HOME==============\\
            case 'NEW_WISH':
                cache.put(chat.id, {payload: {}, state: 'ADD_TITLE'});
                bot.sendMessage(chat.id, frases.add_title).then(() => bot.deleteMessage(chat.id, message_id));
                break;
            case kb.home.search.callback_data:
                bot.sendMessage(chat.id, frases.develop)
                    .then(() => bot.deleteMessage(chat.id, message_id)); //todo
                break;
            case kb.home.feedback.callback_data:
                bot.sendMessage(chat.id, frases.develop)
                    .then(() => bot.deleteMessage(chat.id, message_id)); //todo
                break;
            case 'OPEN_SETTINGS':
                helpers.getUser(chat.id).then(user => {
                    const tags = user.tags || [];
                    bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags(tags, 'TAGS'));
                    cache.put(chat.id, {payload: {tags}, state: 'SETTINGS'});
                }).then(() => bot.deleteMessage(chat.id, message_id));
                break;
            case 'MY_WISHES':
                helpers.getWishes(chat.id).then(data => {
                    const text = 'Список:\n\n' + Object.keys(data).map(wish => `${data[wish].title} ${helpers.getTime(data[wish].time)}`).join('\n');
                    bot.sendMessage(chat.id, text, keyboards.home).then(() => bot.deleteMessage(chat.id, message_id));
                })
                break;
            case kb.home.share.callback_data:
                bot.sendMessage(chat.id, frases.develop)
                    .then(() => bot.deleteMessage(chat.id, message_id)); //todo
                break;

        }
        if (cacheData != null) {
        }

        // if (query.data === 'SUBMIT_TAGS_SETTINGS') {
        //     helpers.updateUser(chat.id, {tags: cacheData.payload.selectedTags});
        //     bot.sendMessage(chat.id, frases.success_tags, keyboards.home);
        //     bot.deleteMessage(chat.id, message_id);
        //     cache.del(chat.id);
        // } else if (query.data === 'SUBMIT_TAGS_ADD') {
        //     bot.deleteMessage(chat.id, message_id);
        //     helpers.addWish({...cacheData.payload, time: query.data, user_id: chat.id});
        //     cache.del(chat.id);
        //     bot.sendMessage(chat.id, frases.add_success, keyboards.home)
        // } else if (cacheData != null) {
        //     switch (cacheData.state) {
        //         case 'TAGS':
        //             if (!Array.isArray(cacheData.payload.selectedTags)) cacheData.payload.selectedTags = [];
        //             const index = cacheData.payload.selectedTags.indexOf(query.data);
        //             index === -1
        //                 ? cacheData.payload.selectedTags.push(query.data)
        //                 : cacheData.payload.selectedTags.splice(index, 1);
        //
        //             bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags(cacheData.payload.selectedTags, cacheData.flag));
        //             bot.deleteMessage(chat.id, message_id);
        //             cache.put(chat.id, cacheData);
        //             break;
        //         case 'ADD_TIME':
        //             cache.put(chat.id, {payload: {...cacheData.payload, time: query.data}, state: 'TAGS', flag: 'ADD'});
        //             bot.sendMessage(chat.id, frases.settings_tags, keyboards.tags([], 'ADD'));
        //             break;
        //     }
        // }
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
