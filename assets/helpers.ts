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
    cancelWish(id){
      return database.removeData(`wishes/${id}`)
    },
    addWish(wish) {
        return database.pushData('wishes/', wish)
    },
    getWishes(id?: number | string) {
        return database.getData('wishes/').then(data => {
            const date = new Date().getTime();
            return Object.keys(data)
                .filter(key => data[key].time >= date && (id ? data[key].user_id === id : true))
                .map(key => ({...data[key], id: key}))
        });
    },
    marshal: (state, payload?: any) => JSON.stringify({state, payload: payload || {}}),
    unmarshal: (data) => JSON.parse(data),
    getTime: (time) => new Date(time).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")

};
