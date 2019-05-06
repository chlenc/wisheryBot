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
        let out;
        out = database.getData('wishes/');
        if(id){
            // out.then()
        }
        return out;
    }

};
