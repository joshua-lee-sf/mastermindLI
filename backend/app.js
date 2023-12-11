import bodyParser from "body-parser";
import Express from "express";
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import 'dotenv/config';
import userRouter from "./routes/users.js";

await mongoose.connect(process.env.MONGO_URI);

const app = Express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api/users', userRouter);
// app.use('/api/games', gameRouter);

// Express Session Config
app.use(session({
    secret: 'linkedin mastermind password',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: app.get('env') === 'production'}
}));

// universal error handler
app.use((error, req, res, next) => {
    console.log(error, "error");
    res.status(400).json({
        error: error.message
    });
});

app.listen(port, () => console.log(`Now listening on port ${port}`));
