import * as TelegramBot from 'node-telegram-bot-api';

require('dotenv').config();
const frases = require('./assets/frases');
const bot = new TelegramBot(process.env.TOKEN, {webHook: {port: +process.env.PORT}})
bot.setWebHook(`${process.env.URL}/bot${process.env.TOKEN}`).catch(e => console.error(e));
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

// bot.onText(/\/test/, (msg) => {
//     const key = {text: 'test', callback_data: 'test'};
//     const keyBoard = [[key]]
//
//     for (let i = 0; i <= 100; i++) {
//         keyBoard.push([key])
//     }
//     bot.sendMessage(msg.chat.id, 'test', {reply_markup: {inline_keyboard: keyBoard}});
//
// });


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
        if (cacheData != null) {
            if (cacheData.state === 'ADD_TITLE') {
                cache.put(chatId, {payload: {title: msg.text}, state: 'ADD_TIME'});
                bot.sendMessage(chatId, frases.add_time, keyboards.add_time()).catch(e => console.error(e));
            }
        }
    } catch (e) {
        console.error(e)
    }
});


bot.on('callback_query', function (query) {
    try {
        const chat = query.message.chat;
        const message_id = query.message.message_id + '';
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
                    helpers.addWish({...cacheData.payload, user_id: chat.id, username: chat.first_name});
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
                    let text = '';
                    const keys = Object.keys(data);
                    for (let wish in keys) {
                        if (text.length >= 3000) {
                            bot.sendMessage(chat.id, text, {parse_mode: 'HTML'});
                            text = '\n'
                        } else {
                            text += `<a href="tg://user?id=${data[wish].user_id}">${(data[wish].username || 'Пользователь')}</a> ` +
                                `хочет ${data[wish].title} в ${helpers.getTime(data[wish].time)}` + '\n\n'
                        }
                    }
                    bot.sendMessage(chat.id, text === '' ? 'Список пуст' : text, {parse_mode: 'HTML', ...keyboards.home})
                        .then(() => bot.deleteMessage(chat.id, message_id));
                });

                break;
            case 'FIND_WISHES':
                helpers.getWishes(chat.id).then(data => {
                    let text = '';
                    const keys = Object.keys(data);
                    for (let wish in keys) {
                        if (text.length >= 3000) {
                            bot.sendMessage(chat.id, text, {parse_mode: 'HTML'});
                            text = '\n'
                        } else {
                            text += `<a href="tg://user?id=${data[wish].user_id}">${(data[wish].username || 'Пользователь')}</a> ` +
                                `хочет ${data[wish].title} в ${helpers.getTime(data[wish].time)}` + '\n\n'
                        }
                    }
                    bot.sendMessage(chat.id, text === '' ? 'Список пуст' : text, {parse_mode: 'HTML', ...keyboards.home})
                        .then(() => bot.deleteMessage(chat.id, message_id));
                });

                break;
            case 'CANCEL_WISHES':
                helpers.getWishes().then(data => {
                    const keyBoard = keyboards.cancel(data)
                    bot.sendMessage(chat.id, keyBoard.length === 0 ? 'Список пуст' : frases.cancel_wish, {reply_markup: {inline_keyboard: keyBoard}});
                });
                break;
            case 'CANCEL_WISH':
                helpers.cancelWish(data.payload);
                helpers.getWishes().then(data => {
                    const keyBoard = keyboards.cancel(data);
                    bot.sendMessage(chat.id, keyBoard.length === 0 ? 'Список пуст' : frases.cancel_wish, {reply_markup: {inline_keyboard: keyBoard}});
                });
                break;
            case kb.home.share.callback_data:
                bot.sendMessage(chat.id, frases.develop)
                    .then(() => bot.deleteMessage(chat.id, message_id)); //todo
                break;

        }
        if (cacheData != null) {
        }

    } catch (e) {
        console.log(e)
    }

})


console.log('Bot has been started ✅ ');
