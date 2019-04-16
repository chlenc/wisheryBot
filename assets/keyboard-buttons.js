const frases = require('./frases')

module.exports = {
    phone: {
        text: 'Отправить номер 📞',
        request_contact: true
    },
    team_ready_yes: {
        text: 'Вступить в группу',
        callback_data: 'team_ready_yes'
    },
    home:{
        report:'Посмотреть отчет 📝',
        income: 'Приход 💵',
        outcome:'Расход 💸',
        help:'Помошь 💡',
        feedback:'Обратная связь 📲',
    },
    cancel: 'Отменить ❌',

    // team_ready_no: {
    //     text: 'Нет',
    //     callback_data: 'team_ready_no'
    // },

}
