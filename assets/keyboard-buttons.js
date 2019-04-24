const frases = require('./frases');

module.exports = {
    phone: {
        text: 'Отправить номер 📞',
        request_contact: true
    },
    inline_tagsSubmit: (flag) => ({
        text: 'Готово',
        callback_data: 'SUBMIT_TAGS_' + flag
    }),


    team_ready_yes: {
        text: 'Вступить в группу',
        callback_data: 'team_ready_yes'
    },
    home: {
        search: 'Найти',
        add: 'Добавить',
        feedback: 'Обратная связь 📲',
        share: 'Поделиться',
        myMatches: 'Мои мачи',
        settings: 'Настройки',
    },
    cancel: 'Отменить ❌',

    // team_ready_no: {
    //     text: 'Нет',
    //     callback_data: 'team_ready_no'
    // },

}
