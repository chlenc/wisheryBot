import * as TelegramBot from 'node-telegram-bot-api';
import { add_time, cancelKey, defaultKeyboard, homeKeyboard, tagsKeyboard } from './assets/keyboard'
import { homeBtn, new_wish } from './assets/keyboard-buttons'

require('dotenv').config();
const frases = require('./assets/frases');
// const bot = new TelegramBot(process.env.TOKEN, {polling: true})
const bot = new TelegramBot(process.env.TOKEN, {webHook: {port: +process.env.PORT}})
bot.setWebHook(`${process.env.URL}/bot${process.env.TOKEN}`).catch(e => console.error(e));
const helpers = require('./assets/helpers');
const cache = require('memory-cache');
const tagsList = require('./assets/tags').tags;


bot.onText(/\/start/, (msg) => {
    helpers.updateUser(msg.chat.id, {...msg.from, tags: tagsList.map(({code}) => code)});
    bot.sendMessage(msg.chat.id, frases.description, defaultKeyboard).then(() => {
        bot.sendMessage(msg.chat.id, frases.welcome, homeKeyboard);
    });
});

bot.onText(/\/home/, (msg) => {
    goHome(msg.chat.id)
});

function goHome(id: string | number): Promise<TelegramBot.Message> {
    cache.del(id);
    return bot.sendMessage(id, frases.welcome, homeKeyboard)
}

bot.onText(/\/test/, (msg) => {
    helpers.getUsers().then(users => {
        Object.keys(users).map(id => {
            helpers.updateUser(id, {...users[id], tags: []})
        })
    })
});


bot.on('message', (msg) => {
    try {
        const chatId = msg.chat.id;
        let cacheData = cache.get(chatId);
        if (msg.text === homeBtn.text) {
            goHome(chatId)
        } else if (msg.text === new_wish.text) {
            cache.del(msg.chat.id);
            cache.put(msg.chat.id, {payload: {}, state: 'ADD_TITLE'});
            bot.sendMessage(msg.chat.id, frases.add_title);
        } else if (cacheData != null) {
            if (cacheData.state === 'ADD_TITLE') {
                cache.put(chatId, {payload: {title: msg.text}, state: 'ADD_TIME'});
                bot.sendMessage(chatId, frases.add_time, add_time()).catch(e => console.error(e));
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

                bot.sendMessage(chat.id, frases.settings_tags, tagsKeyboard(tags, data.state))
                    .then(() => bot.deleteMessage(chat.id, message_id));
                cache.put(chat.id, {state: cacheData.state, payload: {...cacheData.payload, tags}});
                break;
            case 'SUBMIT_TAGS':
                if (cacheData.state === 'SETTINGS') {
                    helpers.updateUser(chat.id, {tags: cacheData.payload.tags});
                    bot.sendMessage(chat.id, frases.success_tags, homeKeyboard)
                        .then(() => bot.deleteMessage(chat.id, message_id));
                    cache.del(chat.id);
                } else if (cacheData.state === 'ADD') {
                    helpers.addWish({...cacheData.payload, user_id: chat.id, username: chat.first_name});
                    cache.del(chat.id);
                    bot.sendMessage(chat.id, frases.add_success, homeKeyboard)
                        .then(() => bot.deleteMessage(chat.id, message_id));

                    helpers.getUsers().then(users => {
                        Object.keys(users).map(id => {
                            const userTags = users[id].tags || [];
                            const wishTags = cacheData.payload.tags || [];
                            const matches = userTags.filter((obj) => wishTags.indexOf(obj) >= 0);
                            if (matches.length > 0 && +id !== chat.id) {
                                bot.sendMessage(id, `<a href="tg://user?id=${chat.id}">${(chat.username || 'Пользователь')}</a> ` +
                                    `хочет ${cacheData.payload.title} в ${helpers.getTime(cacheData.payload.time)}`, {parse_mode: 'HTML'}).catch(e => {
                                        console.log(`user ${users[id].first_name} ${id}`)
                                })
                            }
                        })
                    })
                }
                break;



            //===========ADD==============\\
            case 'ADD_TIME':
                helpers.getUser(chat.id).then(user => {
                    cache.put(chat.id, {
                        payload: {...cacheData.payload, time: data.payload, tags: user.tags},
                        state: 'ADD'
                    });
                    bot.sendMessage(chat.id, frases.settings_tags, tagsKeyboard(user.tags, 'TAGS'))
                        .then(() => bot.deleteMessage(chat.id, message_id));
                });
                break;
            //===========HOME==============\\
            case 'NEW_WISH':
                cache.put(chat.id, {payload: {}, state: 'ADD_TITLE'});
                bot.sendMessage(chat.id, frases.add_title).then(() => bot.deleteMessage(chat.id, message_id));
                break;
            case 'GO_HOME':
                goHome(chat.id).then(() => {
                    bot.deleteMessage(chat.id, message_id);
                });;
                break;
            case 'FEEDBACK':
                bot.sendMessage(chat.id, frases.feedback);
                break;
            case 'OPEN_SETTINGS':
                helpers.getUser(chat.id).then(user => {
                    const tags = user.tags || [];
                    bot.sendMessage(chat.id, frases.settings_tags, tagsKeyboard(tags, 'TAGS'));
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
                    bot.sendMessage(chat.id, text === '' ? 'Список пуст' : text, {parse_mode: 'HTML', ...homeKeyboard})
                        .then(() => bot.deleteMessage(chat.id, message_id));
                });

                break;
            case 'FIND_WISHES':
                helpers.getUser(chat.id).then(user => {
                    // user.tags
                    helpers.getWishes().then(data => {
                        let text = '';
                        const keys = Object.keys(data);
                        for (let wish in keys) {
                            if (data[wish].user_id === user.user_id) continue;
                            if (text.length >= 3000) {
                                bot.sendMessage(chat.id, text, {parse_mode: 'HTML'});
                                text = '\n'
                            } else {
                                text += `<a href="tg://user?id=${data[wish].user_id}">${(data[wish].username || 'Пользователь')}</a> ` +
                                    `хочет ${data[wish].title} в ${helpers.getTime(data[wish].time)}` + '\n\n'
                            }
                        }
                        bot.sendMessage(chat.id, text === '' ? 'Список пуст' : text, {parse_mode: 'HTML', ...homeKeyboard})
                            .then(() => bot.deleteMessage(chat.id, message_id));
                    });
                });

                break;
            case 'CANCEL_WISHES':
                helpers.getWishes(chat.id).then(data => {
                    const keyBoard = data ? cancelKey(data) : [];
                    bot.sendMessage(
                        chat.id,
                        keyBoard.length === 0 ? 'Список пуст' : frases.cancel_wish,
                        {reply_markup: {inline_keyboard: keyBoard}}
                    ).then(() => {
                        bot.deleteMessage(chat.id, message_id);
                    });
                });
                break;
            case 'CANCEL_WISH':
                helpers.cancelWish(data.payload);
                helpers.getWishes(chat.id).then(data => {
                    const keyBoard = data ? cancelKey(data) : [];
                    bot.sendMessage(
                        chat.id,
                        keyBoard.length === 0 ? 'Список пуст' : frases.cancel_wish,
                        {reply_markup: {inline_keyboard: keyBoard}}
                    ).then(() => {
                        bot.deleteMessage(chat.id, message_id);
                    });
                });
                break;
        }
        if (cacheData != null) {
        }

    } catch (e) {
        console.log(e)
    }

})


console.log('Bot has been started ✅ ');
