const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const Todo = new Schema({
    text: {
        type: String,
        require: true
    },
    isCompleted: {
        type: Boolean,
        require: true
    },
    DateTime: {
        type: Date,
        default: Date.now(),
        require: true
    },
    username: {
        type: String,
        require: true
    }
});

module.exports = Mongoose.model("todos", Todo); // we are connecting this with todos collection that we created in MongoDB