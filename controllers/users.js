import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import session from "express-session";
import crypto from 'crypto';

const createPasswordDigest = async (password) => {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
};

const generateSessionToken = async () => {
    const token = crypto.randomBytes(16).toString('base64url');
    return (await User.findOne({sessionToken: token})) ? generateSessionToken() : token
};

const isPassword = async (username, password) => {
    const user = await User.findOne({username: username});
    if (user) return bcrypt.compare(password, user.passwordDigest);
};

export const createNewUser = async (req, res, next) => {
    const checkUser = await User.findOne({username: req.body.username});
    if (checkUser) return next(new Error('Username is already taken'));

    const newUser = new User({
        username: req.body.username,
        passwordDigest: await createPasswordDigest(req.body.password),
        sessionToken: await generateSessionToken(),
        gameHistory: [],
        score: {
            wins: 0,
            losses: 0,
        }
    });
    await newUser.save();
    res.status(200).send(newUser.sessionToken);
};

export const loginUser = async (req, res, next) => {
    if (await isPassword(req.body.username, req.body.password)) {
        // testing user
        const user = await User.findOne({username: req.body.username});

        req.session.regenerate(async function (err) {
            if (err) next(err)
            req.session.user = req.body.username
            req.session.save(function (err) {
                if (err) return next(err)
            });
            user.sessionToken = await generateSessionToken();
            user.save();
            res.json(user.sessionToken);
        });
    } else {
        next(new Error('Invalid credentials'));
    };
};

export const getCurrentUser = async (req, res, next) => {
    const token = req.query.sessionToken;
    let user = await User.findOne({sessionToken: token});
    
    if (!user) {
        next(new Error('Could not find user'));
    } else {
        res.status(200).send(JSON.stringify(user));
    };
};

