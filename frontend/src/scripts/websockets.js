import { checkGuess, getGame, startNewGame, updateGameHistory } from "./game.js";
import { socket } from '../index.js';
import { updateUserScore } from "./user.js";

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
        case 'sendGuessBackend':
            receiveGuess(parsedMessage.payload);
            break;
        case 'sendResponse':
            receiveResponse(parsedMessage.payload);
            break;
        case 'sendResult':
            receiveResult(parsedMessage.payload);
            break;
        default:
            console.log('Default case');
    };
};

const errorMessage = document.createElement('p');
errorMessage.setAttribute('class', 'error-message');

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

    if (role) {
        const  multiplayerWaitingMessage = document.getElementById('multiplayer-waiting-message');
        multiplayerWaitingMessage.textContent = "";
    }

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
            multiplayerGameDiv.appendChild(errorMessage);

            if (!!mastercodeInput.value.match(/^[1-6]+$/)) {
                errorMessage.style.display = "none";
                localStorage.setItem('mastercode', mastercodeInput.value);
                const masterCodeLength = mastercodeInput.value.length;
                const newGame = await startNewGame(sessionToken, null, mastercodeInput.value, partyId);
    
                if (newGame) {
                    localStorage.setItem('gameId', newGame.data); 
                };
    
                const payload = {
                    type: 'sendGameId',
                    gameId: newGame.data,
                    masterCodeLength
                };
    
                await sendGameId(payload);
            } else {
                errorMessage.textContent = "Invalid mastercode. Please try again!"
            }
        });
    };
};

const sendGameId = async (payload) => {
    const {gameId, masterCodeLength} = payload;
    const sessionToken = localStorage.getItem('sessionToken');
    await updateGameHistory(gameId, sessionToken);
    localStorage.setItem('gameId', gameId);


    const role = localStorage.getItem('role');
    const currentGame = await getGame(gameId);


    if (role === 'codeBreaker') {

        const multiplayerGameDiv = document.getElementById('multiplayer-game-div');
        multiplayerGameDiv.style.display = 'none';
    
        // enter code here for creating guess form and previous guesses etc.
        const currentGame = await getGame(gameId);
        const masterCodeLength = currentGame.masterCodeLength;
        localStorage.setItem('masterCodeLength', masterCodeLength);
    
        const currentGameDiv = document.getElementById('current-game-div');
        currentGameDiv.style.display = 'flex';
    
        const previousGuessesList = document.getElementById('previous-guess-list');
        
        const previousGuessesArray = currentGame?.previousGuesses;
    
        if (previousGuessesArray.length > 0) {
            previousGuessesArray.forEach((previousGuess) => {
                const previousGuessElement = document.createElement("li");
                previousGuessElement.textContent = previousGuess;
                previousGuessesList.appendChild(previousGuessElement);
            })
        } else {
            const noGuesses = document.createElement('li');
            noGuesses.textContent = 'No guesses yet. Please make a guess.';
            previousGuessesList.appendChild(noGuesses);
        };
    
        const guessForm = document.getElementById('guess-form');
        guessForm.style.display = 'flex';
        const guessInput = document.getElementById('guess-input');
    
        guessInput.setAttribute('placeholder', `Enter your ${masterCodeLength} digit guess between 1 & 6 here.`);
        
        const nearMatchesElement = document.createElement('p');
        const exactMatchesElement = document.createElement('p');
        guessForm.append(nearMatchesElement);
        guessForm.append(exactMatchesElement);
        guessForm.append(errorMessage);
    
        // guessForm.addEventListener('submit', (event) => {
        //     event.preventDefault();
        // });
    
        // const submitGuessButton = document.getElementById('submit-guess-button');
        
        // submitGuessButton.addEventListener('click', async (event) => {
        //     event.preventDefault();

        //     const guess = guessInput.value;
        //     const game = gameId;
        //     const partyId = localStorage.getItem('partyId');
        
        //     if (guess.length !== masterCodeLength || !guess.match(/^[1-6]+$/)) {
        //         errorMessage.textContent = "Invalid guess, please try again!";
        //     } else {

        //         socket.send(JSON.stringify({
        //             type:'sendGuess',
        //             payload: {
        //                 guess, 
        //                 gameId, 
        //                 sessionToken,
        //                 partyId
        //             }
        //         }));
    
        //         guessForm.style.display = 'none';
        //         const multiplayerGameDiv = document.getElementById('multiplayer-game-div');
        //         multiplayerGameDiv.style.display = 'block';
        //         const waitingMessage = document.getElementById('waiting-message');
        //         waitingMessage.textContent = 'Waiting for other player';
        //     }
            
        // });
    };
};


const receiveGuess = async (payload) => {
    // only for codemaster
    const {
        guess, 
        gameId, 
        sessionToken,
        partyId
    } = payload;

    const game = await getGame(gameId);

    const waitingMessage = document.getElementById('waiting-message');
    waitingMessage.textContent = "";

    
    const codeMasterDiv = document.getElementById('codemaster-div');
    codeMasterDiv.style.display = 'block';
    const masterCode = localStorage.getItem('mastercode');

    const masterCodeText = document.getElementById('multiplayer-master-code');
    masterCodeText.textContent = "Mastercode: " + masterCode;

    const currentGuessTextElement = document.getElementById('multiplayer-current-guess');
    currentGuessTextElement.textContent = "Current Guess: " + guess;

};

const multiplayerGuessForm = document.getElementById('multiplayer-guess-check');

multiplayerGuessForm.addEventListener('submit', async (e) => {
    
    e.preventDefault();
    errorMessage.textContent = "";
    const nearMatchesInput = document.getElementById('near-matches');
    const exactMatchesInput = document.getElementById('exact-matches');
    const sessionToken = localStorage.getItem('sessionToken');
    const partyId = localStorage.getItem('partyId');
    const gameId = localStorage.getItem('gameId');
    
    
    const nearMatchesValues = parseInt(nearMatchesInput.value);
    const exactMatchesValues = parseInt(exactMatchesInput.value);
    
    const codeMasterDiv = document.getElementById('codemaster-div');
    const waitingMessage = document.getElementById('waiting-message');
    
    const currentGuessTextElement = document.getElementById('multiplayer-current-guess');
    const guess = currentGuessTextElement.textContent.slice(15);
    
    try {
        const result = await checkGuess(guess, sessionToken, gameId, partyId, exactMatchesValues, nearMatchesValues);
        
        if (result.message) {
            const {message, game, user} = result;
            const {wins, losses} = user.score;
            const endSessionButton = document.getElementById('end-session-button');
            endSessionButton.style.display = "block";
            const winRecord = document.getElementById('win-record');
            const lossRecord = document.getElementById('loss-record');
            const statusElement = document.getElementById('status');

            winRecord.textContent = "Wins: " + wins;
            lossRecord.textContent = "Lost:" + losses;

            statusElement.textContent = message.includes('won') ? "You are the winner!" : "You are the loser!"
        } else {
            codeMasterDiv.style.display = 'none';
            waitingMessage.textContent = "Waiting for other player response...";
        
            const codeInputValue = document.getElementById('guess-input');
            codeInputValue.value = "";
            nearMatchesInput.value = "";
            exactMatchesInput.value = "";
        }

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
        multiplayerGuessForm.appendChild(errorMessage);
    }
});

const receiveResponse = async (payload) => {
    // only for code breaker

    const currentGameDiv = document.getElementById('current-game-div');
    const guessForm = document.getElementById('guess-form');
    guessForm.style.display = "block";

    const {
        humanExactMatches, 
        humanNearMatches, 
        attemptsLeft,
        gameId
    } = payload;

    const currentGame = await getGame(gameId);

    const codeBreakerGameDiv = document.getElementById('codebreaker-div');
    codeBreakerGameDiv.style.display = 'block';

    // Create the previous guess list
    const previousGuessList = document.getElementById('previous-guess-list');
    const previousGuessesArray = currentGame?.previousGuesses;
    
    
    
    if (previousGuessesArray.length === 1) {
        const deleteThisElement = previousGuessList.querySelector('li');
        previousGuessList.removeChild(deleteThisElement);
    };
    
    if (previousGuessesArray.length > 0) {
        const previousGuessElement = document.createElement("li");
        const previousGuess = previousGuessesArray[previousGuessesArray.length - 1];
        previousGuessElement.textContent = previousGuess;
        previousGuessList.append(previousGuessElement);
    } else {
        const noGuesses = document.createElement('li');
        noGuesses.textContent = 'No guesses yet. Please make a guess.';
        previousGuessList.appendChild(noGuesses);
    };

    // const multiplayerGuessForm = document.getElementById('multiplayer-guess-form');
    // multiplayerGuessForm.style.display = "block";
    
    // multiplayerGuessForm.addEventListener('onsubmit', (e) => {
    //     e.preventDefault()
    // })

    // const multiplayerSubmitGuessButton = document.getElementById('multiplayer-submit-guess-button');

    // multiplayerSubmitGuessButton.addEventListener('click', (event) => {
    //     event.preventDefault();

    //     const partyId = localStorage.getItem('partyId');
            
    //     socket.send(JSON.stringify({
    //         type:'sendGuess',
    //         payload: {
    //             guess, 
    //             gameId, 
    //             sessionToken,
    //             partyId
    //         }
    //     }));

    //     guessForm.style.display = 'none';
    //     const multiplayerGameDiv = document.getElementById('multiplayer-game-div');
    //     multiplayerGameDiv.style.display = 'block';
    //     const waitingMessage = document.getElementById('waiting-message');
    //     waitingMessage.textContent = 'Waiting for other player...';
    // })
};

const receiveResult = async (payload) => {
    console.log(payload);
    const sessionToken = localStorage.getItem('sessionToken');
    const {status} = payload;

    const result = await updateUserScore(sessionToken, status);
    const {wins, losses} = result.score

    const endGameDiv = document.getElementById('endgame-div');
    endGameDiv.style.display = "block";

    const winRecord = document.getElementById('win-record');
    const lossRecord = document.getElementById('loss-record');
    const statusElement = document.getElementById('status');

    statusElement.textContent = status === "won" ? "You are the winner!" : "You are the loser!";
    winRecord.textContent = "Wins: " + wins;
    lossRecord.textContent = "Lost:" + losses;

    const endSessionButton = document.getElementById('end-session-button');
    endSessionButton.style.display = "block";
};

const endSessionButton = document.getElementById('end-session-button');
playAgainButton.style.display = "none";
endSessionButton.style.display = "none"

endSessionButton.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('role');
    localStorage.removeItem('gameId');
    localStorage.removeItem('mastercode');
    localStorage.removeItem('masterCodeLength');
    localStorage.removeItem('partyId');
    location.reload();
});

