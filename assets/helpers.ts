const database = require('./database');

module.exports = {

    getUser(chatId) {
        return database.getData('users/' + chatId)
    },
    addUser(user) {
        return database.setData('users/' + user.id, user)
    },
    updateUser(id, data) {
        return database.updateData('users/' + id, data)
    },
    addWish(wish){
        return database.pushData('wishes/', wish)
    },
    getWishes(id){
        const out = database.getData('wishes/');
        const date = new Date().getTime();
        return Object.keys(out).filter(key => out[key].time >= date && (id ? out[key].user_id === id : true))
    },
    marshal : (state, payload) => JSON.stringify({state, payload: payload || {}}),
    unmarshal : (data) => JSON.parse(data),
    getTime: (time) => new Date(time).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")

};
