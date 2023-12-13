import Party from './Party.js';
import { webSocketCodeMasterAnalyze, webSocketSendGuess } from './controllers/games.js';

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
        case 'sendGuess':
            sendGuess(ws, parsedMessage.payload);
            break;
        case 'checkGuess':
            checkGuess(ws, parsedMessage.payload);
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

const sendGuess = async (ws, payload) => {
    if (typeof payload !== 'object') {
        ws.send(JSON.stringify({
            error: 'Not an object!'
        }));
    };

    const {guess, gameId, sessionToken} = payload;

    const data = await webSocketSendGuess(guess, gameId, sessionToken);
    ws.send(JSON.stringify(data));
};

const checkGuess = async (ws, payload) => {
    if (typeof payload !== 'object') {
        ws.send(JSON.stringify({
            error: 'Not an object!'
        }));
    };

    const {
        gameId, 
        guess, 
        sessionToken, 
        humanExactMatches, 
        humanNearMatches
    } = payload;
    const data = 
    await webSocketCodeMasterAnalyze(
        gameId, 
        guess, 
        sessionToken, 
        humanExactMatches, 
        humanNearMatches
    );
    console.log(data)
    ws.send(JSON.stringify(data));
}

// const createGame = async (ws, payload) => {
//     if (typeof payload !== 'object') {
//         ws.send(JSON.stringify({
//             error: 'Not an object!'
//         }));
//     };
    
//     const {sessionToken, masterCode} = payload;

//     await webSocketCreateGame(sessionToken, masterCode);
//     ws.send()
// };


