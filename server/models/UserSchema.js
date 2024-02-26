const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const User = new Schema({
    name: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    age: {
        type: Number,
        require: true
    },
    gender: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
});

module.exports = Mongoose.model("users", User);