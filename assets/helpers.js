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
    }

};
