const jwt = require("jsonwebtoken");

const isAuth = (req, res, next) => {
    try {
        const token = req.headers["x-acciojob"];
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.locals = verified;
        // console.log(verified);
        // console.log(req.params.username);
        // checking if verified has previous user data or login user data..
        if (verified && verified.username == req.params.username) {
            next();
        }
        else {
            return res.status(401).send({
                status: 401,
                message: "Unauthorized User!"
            });
        }

    }
    catch (err) {
        res.status(500).send({
            status: 500,
            message: "Integer server error!",
            data: err
        });
        // res.status(401).send({
        //     status: 401,
        //     message: "Unauthorized User!",
        //     data: err
        // });
    }
}

module.exports = { isAuth };