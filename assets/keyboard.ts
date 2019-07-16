const tags = require('./tags').tags;
const helpers = require('./helpers');
import * as TelegramBot from 'node-telegram-bot-api';
import * as kb from './keyboard-buttons'

export const defaultKeyboard: TelegramBot.SendMessageOptions = {
    reply_markup: {
        keyboard: [[kb.new_wish],[kb.homeBtn]],
        resize_keyboard: true
    }
}

export const homeKeyboard: TelegramBot.SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [kb.homeMenu.search],
            [kb.homeMenu.add, kb.homeMenu.cancelWish],
            [kb.homeMenu.myWishes, kb.homeMenu.settings],
            [kb.homeMenu.feedback, kb.homeMenu.share],
        ]
    }
};


export const tagsKeyboard = (selectedTags, flag) => {
    return {
        reply_markup: {
            inline_keyboard: [...tags.map(({name, code}) => [{
                text: name + (selectedTags.includes(code) ? ' ✅' : ''),
                callback_data: helpers.marshal(flag, code)
            }]), [kb.inline_tagsSubmit(flag)]]
        }
    }
};


export const add_time = () => {

    let date = new Date();
    let out = [];
    let i = 0;

    const addZero = (v) => ('0' + v).slice(-2);

    const getButton = (date) => ({
        text: addZero(date.getHours()) + ':' + addZero(date.getMinutes()),
        callback_data: helpers.marshal('ADD_TIME', date.getTime())
    });

    for (let r = 0; r < 7; r++) {
        let row = [];
        for (let c = 0; c < 4; c++) {
            date.setMinutes(date.getMinutes() + i * 5);
            row.push(getButton(date));
            i++;
        }
        out.push(row)
    }

    return {
        reply_markup: {
            inline_keyboard: out
        }
    }

}

export const cancelKey = (data) => {
    return data.map(({id, title}) => {
            return [{
                text: `Отменить ${title}`,
                callback_data: helpers.marshal('CANCEL_WISH', id)
            }]
        }
    );
}
