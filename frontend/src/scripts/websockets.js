import { startNewGame, updateGameHistory } from "./game";

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
        default:
            console.log('Default case');
    };
};

const partyCreated = (payload) => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    const {partyId, role} = payload;
    localStorage.setItem('role', role);
    localStorage.setItem('partyId', partyId);

    const multiplayerGameDiv = document.createElement('div');
    multiplayerGameDiv.setAttribute('id', 'multplayer-game-divv');
    document.body.appendChild(multiplayerGameDiv);

    const roleInformation = document.createElement('p');
    const waitingMessage = document.createElement('p');
    multiplayerGameDiv.appendChild(roleInformation);
    roleInformation.append(waitingMessage);

    if (role === 'codeBreaker') {
        roleInformation.textContent = 'You are the Code Breaker';
        waitingMessage.textContent = 'Please wait for the code master to set up master code.'
        multiplayerGameDiv.appendChild(roleInformation);
        roleInformation.append(waitingMessage);
    } else {
        roleInformation.textContent = 'You are the Code Master';
        waitingMessage.textContent = 'Please input a master code below.';
        multiplayerGameDiv.appendChild(roleInformation);
        roleInformation.append(waitingMessage);
        
        const mastercodeInput = document.createElement('input');
        mastercodeInput.setAttribute('type', 'text');
        mastercodeInput.setAttribute('placeholder', 'Please input a code betweeen 1 and 10 digits using numbers 1 through 6.');
        roleInformation.append(mastercodeInput);

        const submitMasterCodeButton = document.createElement('button');
        submitMasterCodeButton.textContent = 'Submit Code';
        roleInformation.append(submitMasterCodeButton);

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

const sendGuess = async (payload) => {
    const {guess} = payload;
};