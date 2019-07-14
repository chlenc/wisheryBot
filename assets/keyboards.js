const kb = require('./keyboard-buttons');
const tags = require('./tags').tags;
const helpers = require('./helpers');

module.exports = {
    phone: {
        reply_markup: {
            keyboard: [[kb.phone]],
            one_time_keyboard: true
        }
    },
    home: {
        reply_markup: {
            inline_keyboard: [
                [kb.home.search],
                [kb.home.add, kb.home.cancelWish],
                [kb.home.myWishes, kb.home.settings],
                [kb.home.feedback, kb.home.share],
            ]
        }
    },
    tags(selectedTags, flag) {
        return {
            reply_markup: {
                inline_keyboard: [...tags.map(({name, code}) => [{
                    text: name + (selectedTags.includes(code) ? ' ✅' : ''),
                    callback_data: helpers.marshal(flag, code)
                }]), [kb.inline_tagsSubmit(flag)]]
            }
        }
    },

    add_time: () => {

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

    },

    cancel(data) {
        return data.map(({id, title}) => {
                return [{
                    text: `Отменить ${title}`,
                    callback_data: helpers.marshal('CANCEL_WISH', id)
                }]
            }
        );
    }

}
