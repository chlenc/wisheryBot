require('dotenv').config();
const firebase = require('firebase-admin');

firebase.initializeApp({
    credential: firebase.credential.cert(JSON.parse(process.env.DATABASE_KEY)),
    databaseURL: process.env.DATABASE_URL
});

module.exports = {
    getData(path) {
        return firebase.database().ref(path).once('value').then(function (data) {
            return data.val()
        })
    },
    pushData(path, data) {
        return firebase.database().ref(path).push(data).then(data => {
            return (data.path.pieces_)
        });
    },
    setData(path, data) {
        firebase.database().ref(path).set(data)
    },
    updateData(path, data) {
        firebase.database().ref(path).update(data)
    },
    removeData(path) {
        firebase.database().ref(path).remove()
    }
}
