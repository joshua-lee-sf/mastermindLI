import { checkGuess, startNewGame, updateGameHistory } from "./game.js";

export const incomingMessage = (event) => {
    const parsedMessage = JSON.parse(event.data);

    if (!parsedMessage.type || !parsedMessage.payload) {
        console.log('Message is not formatted correctly.');
        return;
    };

    switch (parsedMessage.type) {
        case 'notifyPlayer':
            partyCreated(parsedMessage.payload);
            break;
        case 'sendGameId':
            sendGameId(parsedMessage.payload);
            break;
        case 'sendGuess':
            receiveGuess(parsedMessage.payload);
            break;
        default:
            console.log('Default case');
    };
};

const partyCreated = (payload) => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    const {partyId, role} = payload;
    localStorage.setItem('role', role);
    localStorage.setItem('partyId', partyId);

    const multiplayerGameDiv = document.getElementById('multiplayer-game-div');
    multiplayerGameDiv.style.display = "block";

    const roleInformation = document.getElementById('role-assignment');
    const waitingMessage = document.getElementById('waiting-message');
    const mastercodeInput = document.getElementById('mastercode-input');
    const submitMasterCodeButton = document.getElementById('submit-mastercode-button');


    if (role === 'codeBreaker') {
        roleInformation.textContent = 'You are the Code Breaker';
        waitingMessage.textContent = 'Please wait for the code master to set up master code.'
        mastercodeInput.style.display = "none";
        submitMasterCodeButton.style.display = "none";

    } else {
        roleInformation.textContent = 'You are the Code Master';
        waitingMessage.textContent = 'Please input a master code below.';
        
        mastercodeInput.setAttribute('placeholder', 'Please input a code betweeen 1 and 10 digits using numbers 1 through 6.');
        mastercodeInput.style.display = 'block';


        submitMasterCodeButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const newGame = await startNewGame(sessionToken, null, mastercodeInput.value, partyId);

            if (newGame) {
                localStorage.setItem('gameId', newGame.data); 
            };

            await sendGameId();
        });
    };
};

const sendGameId = async (payload) => {
    const {gameId} = payload;
    const sessionToken = localStorage.getItem('sessionToken');
    await updateGameHistory(gameId, sessionToken);
    localStorage.setItem('gameId', gameId);
    location.reload();
};

const receiveGuess = async (payload) => {
    const {
        guess, 
        gameId, 
        sessionToken,
        partyId
    } = payload;

    
    const codeMasterDiv = document.getElementById('codemaster-div');
    codeMasterDiv.style.display = 'block';

    const nearMatchesInput = document.getElementById('near-matches');
    const exactMatchesInput = document.getElementById('exact-matches');
    const nearMatchesValue = parseInt(nearMatchesInput.value);
    const exactMatchesValue = parseInt(exactMatchesInput.value);

    const submitResponseButton = document.getElementById('submit-multiplayer-response-button');

    submitResponseButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await checkGuess(guess, sessionToken, gameId, partyId,exactMatchesValue, nearMatchesValue);
    })
};

const receiveResponse = async (payload) => {

}

