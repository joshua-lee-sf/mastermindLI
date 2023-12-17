import Game from './models/Game.js';
import Party from './Party.js';
import User from './models/User.js';

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
        case 'notifyCodeMaster':
            notifyCodeMaster(ws);
            break;
        case 'notifyCodeBreaker':
            notifyCodeBreaker();
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

    const {guess, gameId, sessionToken, partyId} = payload;

    const game = await Game.findById(gameId);
    const user = await User.findOne({sessionToken});

    const {codeMaster} = Party.parties[partyId];

    if (!game.players.includes(user.id)) game.players.push(user.id);
    
    codeMaster.send(JSON.stringify({
        type: 'sendGuess',
        payload,
    }));
};



const notifyCodeMaster = (ws) => {
    if (typeof payload !== 'object') {
        ws.send(JSON.stringify({
            error: 'Not an object!'
        }));
    };

    ws.send(payload);
};

const notifyCodeBreaker = (ws, payload) => {
    if (typeof payload !== 'object') {
        ws.send(JSON.stringify({
            error: 'Not an object!'
        }));
    };

    ws.send(payload);
};

// const checkGuess = async (ws, payload) => {
//     if (typeof payload !== 'object') {
//         ws.send(JSON.stringify({
//             error: 'Not an object!'
//         }));
//     };

//     const {
//         gameId, 
//         guess, 
//         sessionToken, 
//         humanExactMatches, 
//         humanNearMatches
//     } = payload;
    
//     const data = 
//     await webSocketCodeMasterAnalyze(
//         gameId, 
//         guess, 
//         sessionToken, 
//         humanExactMatches, 
//         humanNearMatches
//     );

//     // make sure to send to other client
//     ws.send(JSON.stringify(data));
// };

export const roleDelivery = async (ws, payload)  => {
    if (typeof payload !== 'object') {
        ws.send(JSON.stringify({
            error: 'Not an object!'
        }));
    };
};
