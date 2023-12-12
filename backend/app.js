import bodyParser from "body-parser";
import Express from "express";
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import { WebSocketServer } from 'ws';
import 'dotenv/config';
import userRouter from "./routes/users.js";
import gameRouter from "./routes/games.js";
import { incomingMessage } from "./WebsocketServer.js";
import Party from "./Party.js";

await mongoose.connect(process.env.MONGO_URI);

const app = Express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());



// Express Session Config
app.use(session({
    secret: 'linkedin mastermind password',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: app.get('env') === 'production'}
}));

app.use('/api/users', userRouter);
// app.use('/api/games', gameRouter);
app.use('/api/games', gameRouter);

// universal error handler
app.use((error, req, res, next) => {
    console.log(error, "error");
    res.status(400).json({
        error: error.message
    });
});

// Websockets
const server = app.listen(port, () => console.log(`Now listening on port ${port}`));
const wss = new WebSocketServer({server});

wss.on('connection', function connection(ws) {
    console.log('A new client Connected!');

    ws.send('Welcome New Client');

    ws.on('message', incomingMessage.bind(null, ws));
    ws.
    
    Party.creatingParty(ws);
});