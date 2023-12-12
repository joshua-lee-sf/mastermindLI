import Party from './Party.js';
import { createNewGame } from './controllers/games.js';

export const incomingMessage = (ws, message) => {
    const parsedMessage = JSON.parse(message);

    if (!parsedMessage.type || !parsedMessage.payload) {
        ws.send(JSON.stringify({
            error: 'Not a valid message'
        }));
        return;
    };

    switch (parsedMessage.type) {
        case 'echo':
            echo(ws, message);
            break;
        default:
            ws.send(JSON.stringify({
                error: 'Invalid Message Type'
            }));
    };
};

const echo = (ws, message) => {
    ws.send(message.toString('utf-8'));
};

const sendGuess = (ws, message) => {
    // codebreaker sends in their guess message
    // express request to save the guess into previous guesses of that current game
};



