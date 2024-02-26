// if want to connect with mongodb = mongodb+srv://emailsandeep893:sandeep123@cluster0.bmtr9u5.mongodb.net/?retryWrites=true&w=majority

// if want connect with mongodb along with specific database = mongodb+srv://emailsandeep893:sandeep123@cluster0.bmtr9u5.mongodb.net/<database Name>?retryWrites=true&w=majority

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Todo = require("./models/TodoSchema");
const User = require("./models/UserSchema");
const bcrypt = require("bcrypt");
const { isUserExists } = require("./utils/UsernameCheck");
const { LoggerMiddleware } = require("./middleware/LoggerMiddleware");
const { auth, isAuth } = require("./middleware/AuthMiddleware");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// middleware (globaly implying)
app.use(express.json()); // applied on every API
// app.use(LoggerMiddleware); // applied on every API
// if we want to use middleware in specific API we can do...
// app.post("/login", LoggerMiddleware, async (req, res) =>{})


const SOLT_ROUNDS = 15; // this many times user password will go through bcrypt hasing

// POST - creating Registration API
app.post("/register", async (req, res) => {
    const userBoby = req.body;
    const isUser = await isUserExists(userBoby.username); // checking if user exists

    // if isUser exists
    if (isUser) {
        res.status(400).send({
            status: 400,
            message: "User already registered!"
        });
    }
    // using bcrypt to hash the normal string password to prevent hacking..
    const hashedPassword = await bcrypt.hash(userBoby.password, SOLT_ROUNDS);
    const userObj = new User({
        name: userBoby.name,
        username: userBoby.username,
        password: hashedPassword,
        email: userBoby.email,
        age: userBoby.age,
        gender: userBoby.gender
    });

    try {
        await userObj.save();
        res.status(201).send({
            status: 201,
            message: "Successfully registered!"
        });
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Failed to register!"
        });
    }
});

// POST - User Login API..
app.post("/login", async (req, res) => {
    const loginBody = req.body; // getting from clien(frontend)
    let userData;
    try {
        userData = await User.findOne({ username: loginBody.username }); //fetching userdata from mongoDB to compare both data passwords..

    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Failed to Login!"
        })
    }
    let isPasswordSame;
    try {
        // comparing frontend(client) password and the mongoDB userpassword
        isPasswordSame = await bcrypt.compare(loginBody.password, userData.password);
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Bcrypt failed!"
        })
    }

    let payload = {
        name: userData.name,
        username: userData.username,
        email: userData.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

    if (isPasswordSame) {
        res.status(200).send({
            status: 200,
            message: "Login successfull",
            user: payload,
            token: token
        });
    }
    else {
        res.status(400).send({
            status: 400,
            message: "Incorrect password"
        })
    }

});



// Todo APP
// POST - Creating a new Todo
app.post("/todo", isAuth, async (req, res) => {
    const { text, isCompleted, username } = req.body;
    if (text.length == 0 || isCompleted == null) {
        return res.status(400).send({
            status: 400,
            message: "Please provide all data!"
        });
    }
    try {
        const todoObj = new Todo({
            text,
            isCompleted,
            username,
        });
        // saving this todoObj in MongoDB
        await todoObj.save();

        res.status(201).send({
            status: 201,
            message: "Todo is created successfully!"
        });
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Failed to create a Todo!"
        });
    }
});

// GET - Get all todos
// getting all todos of logged in user only..
app.get("/todos/:username", isAuth, async (req, res) => {
    // console.log(req.locals);
    const username = req.params.username; // we adding username we want to see specific user's todos not everyone's todos..
    const page = req.query.page || 1;
    const LIMIT = 5;
    try {
        const todoList = await Todo.find({ username }).skip((page - 1) * LIMIT).limit(LIMIT);
        // .skip() is used to skip previous outcomes. it is used in pagination
        // if we want to get a sorted data based on time of creation
        // we will use .sort() like:- await Todo.find({}).sort({dataTime: 1}) (ascending order)
        // await Todo.find({}).sort({dateTime: -1}) (descending order)
        res.status(200).send({
            status: 200,
            message: "Fetched all todos successfully!",
            data: todoList
        });
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Faild to get all todos"
        });
    }
});

// GET - Get single todo by ID
app.get("/todo/:id", isAuth, async (req, res) => {
    try {
        const todoId = req.params.id;
        const todoData = await Todo.findById(todoId);

        res.status(200).send({
            status: 200,
            message: "todo is successfully fetched!",
            data: todoData
        });
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Failed to get the todo!"
        });
    }
});

// DETELE - Delete a todo based on id
app.delete("/todo/:id", isAuth, async (req, res) => {
    const todoId = req.params.id;

    // checking if that todo belongs to whoever is deleting..
    // if not give an error..
    try {
        const todoData = await Todo.findById(todoId);
        if (todoData.username !== req.locals.username) {
            return res.status(400).send({
                status: 400,
                message: "Not allowed to delete as you are not the owner!"
            })
        }
    }
    catch (err) {
        res.status(500).send({
            status: 500,
            message: "Internal Server Error!",
            data: err
        })
    }

    // after that delete if no error occurs...
    try {
        await Todo.findByIdAndDelete(todoId);

        res.status(200).send({
            status: 200,
            message: "Todo successfully deleted!"
        });
    }
    catch (err) {
        res.status(400).send({
            status: 400,
            message: "Failed to delete the todo!"
        });
    }
});


// PUT - Update the todo based on Id
app.put("/todo", isAuth, async (req, res) => {
    const todoId = req.body.todoId;
    try {
        const todoData = await Todo.findById(todoId);
        if (todoData.username !== req.locals.username) {
            return res.status(400).send({
                status: 400,
                message: "Not allowed to delete as you are not the owner!"
            });
        }
    }
    catch (err) {
        res.status(500).send({
            status: 500,
            message: "Internal Server Error!",
            data: err
        });
    }

    // here we are using promises then and catch method...
    Todo.findByIdAndUpdate(todoId, {
        isCompleted: req.body.isCompleted,
        text: req.body.text
    }).then((res1) => {
        res.status(200).send({
            status: 200,
            message: "Todo updated successfully!",
        });
    }).catch((err) => {
        res.status(400).send({
            status: 400,
            message: "Failed to update the todo!",
            data: err
        });
    })
});



// making connection with mongoDB and data collection
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB is Connected!"))
    .catch((err) => console.log(err));

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
})