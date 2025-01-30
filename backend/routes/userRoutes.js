const router = require('express').Router();
const User = require('../models/User');

// Create a new user (Signup)
router.post('/', async (req, res) => {
    try {
        const { name, email, password, picture } = req.body;
        console.log(req.body);
        const user = await User.create({ name, email, password, picture });
        res.status(201).json(user);
    } catch (e) {
        let msg;
        if (e.code === 11000) {
            msg = "User already exists";
        } else {
            msg = e.message;
        }
        console.log(e);
        res.status(400).json(msg);
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByCredentials(email, password);
        user.status = 'online';
        await user.save();
        res.status(200).json(user);
    } catch (e) {
        res.status(400).json(e.message);
    }
});

// Logout user
router.delete('/logout', async (req, res) => {
    try {
        const { _id, newMessages } = req.body;
        const user = await User.findById(_id);
        if (user) {
            user.status = "offline";
            user.newMessages = newMessages;
            await user.save();
        }
        res.status(200).send();
    } catch (e) {
        console.log(e);
        res.status(400).send();
    }
});

module.exports = router;
