const frases = require('./frases');
const helpers = require('./helpers');

export const homeBtn = {
    text: 'Главное меню 🏠',
}
export const cancel = {
    text: 'Отменить ❌',
}
export const ready = {
    text: 'Готово ✅',
}
export const new_wish = {
    text: 'Добавить виш 🌱',
}
export const inline_tagsSubmit = (flag) => ({
    text: 'Готово',
    callback_data: helpers.marshal('SUBMIT_TAGS', flag)
})


export const team_ready_yes = {
    text: 'Вступить в группу',
    callback_data: 'team_ready_yes'
}
export const homeMenu = {
    search: { text: 'Найти', callback_data: helpers.marshal('FIND_WISHES') },
    add: { text: 'Добавить', callback_data: helpers.marshal('NEW_WISH') },
    feedback: { text: 'Обратная связь 📲', callback_data: helpers.marshal('FEEDBACK') },
    share: { text: 'Поделиться', switch_inline_query: 'Присоединяйся' },
    myWishes: { text: 'Мои виши', callback_data: helpers.marshal('MY_WISHES') },
    cancelWish: { text: 'Отменить виши', callback_data: helpers.marshal('CANCEL_WISHES') },
    settings: { text: 'Настройки', callback_data: helpers.marshal('OPEN_SETTINGS') },
}
