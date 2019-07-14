const frases = require('./frases');
const helpers = require('./helpers');

module.exports = {
    phone: {
        text: 'Отправить номер 📞',
        request_contact: true
    },
    inline_tagsSubmit: (flag) => ({
        text: 'Готово',
        callback_data: helpers.marshal('SUBMIT_TAGS', flag)
    }),


    team_ready_yes: {
        text: 'Вступить в группу',
        callback_data: 'team_ready_yes'
    },
    home: {
        search: {text: 'Найти', callback_data: helpers.marshal('FIND_WISHES')},
        add: {text: 'Добавить', callback_data: helpers.marshal('NEW_WISH')},
        feedback: {text: 'Обратная связь 📲', callback_data: helpers.marshal('FEEDBACK')},
        share: {text: 'Поделиться', callback_data: helpers.marshal('SHARE')},
        myWishes: {text: 'Мои виши', callback_data: helpers.marshal('MY_WISHES')},
        cancelWish: {text: 'Отменить виши', callback_data: helpers.marshal('CANCEL_WISHES')},
        settings: {text: 'Настройки', callback_data: helpers.marshal('OPEN_SETTINGS')},
    },
    cancel: 'Отменить ❌',

    // team_ready_no: {
    //     text: 'Нет',
    //     callback_data: 'team_ready_no'
    // },

}
