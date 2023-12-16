import { loginUser, createUser, getCurrentUser } from "../src/scripts/user.js";
import { getGame, getMostRecentGame, startNewGame, checkGuess } from "./scripts/game.js";
import { incomingMessage } from "./scripts/websockets.js";

let socket;
// Web Sockets Functions / Creation
const newURIGenerator = () => {
    const loc = window.location
    let newUri = loc.protocol === "https:" ? "wss:" : "ws:"
    newUri += "//" + loc.host;

    return newUri
};


const multiPlayerGameFunction = async (sessionToken) => {
    const newUri = newURIGenerator();
    socket = new WebSocket(newUri, sessionToken);
    
    socket.addEventListener('message', incomingMessage);
};


const sessionToken = localStorage.getItem('sessionToken');
let userOptions = document.getElementById('nav-right');
userOptions.hidden = 'false';


if (!sessionToken) {

    const loginField = document.getElementById('login-options');
    loginField.style.display = 'grid';

    const errorMessage = document.createElement('p');
    errorMessage.setAttribute('class', 'error-message');

    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');


    userOptions.appendChild(errorMessage);

    const loginBUtton = document.getElementById('login-button');
    const createUserButton = document.getElementById('create-user-button');
    
    createUserButton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await createUser(usernameInput.value, passwordInput.value)
        } catch (error) {
            errorMessage.textContent = error.message;
        };   
    });

    loginBUtton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await loginUser(usernameInput.value, passwordInput.value);
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    })

} else {
    const user = await getCurrentUser(sessionToken);
    const userName = user.username;

    const loginInformationDiv = document.getElementById('logged-in-info');
    const userInfo = document.getElementById('username');
    userInfo.textContent = `Hello ${userName}`;
    loginInformationDiv.style.display = 'flex';

    const logoutButton = document.getElementById('logout-button');

    const errorMessage = document.createElement('p');
    errorMessage.setAttribute('class', 'error-message');
    userOptions.appendChild(errorMessage);

    logoutButton.addEventListener('click', () => {
        try {
            localStorage.clear();
            location.reload();
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
};


const gameId = localStorage.getItem('gameId');
const role = localStorage.getItem('role');

if (!gameId && sessionToken ) {
    const gameOptionsDiv = document.getElementById('game-options-div');
    const codeLengthInput = document.getElementById('code-input');
    const buttonDiv = document.getElementById('button-div');

    gameOptionsDiv.style.display = 'flex';
    buttonDiv.style.display = 'flex';

    const startSinglePlayerGameButton = document.getElementById('computer-button');
    const continuePreviousGame = document.getElementById('previous-game-button');
    const startMultiplayerGame = document.getElementById('multiplayer-button');

    startSinglePlayerGameButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const codeLength = codeLengthInput.value === "" ? '4' : codeLengthInput.value ;
        const game = await startNewGame(sessionToken, codeLength, null);
        localStorage.setItem('gameId', game.data);
        location.reload();
    });

    continuePreviousGame.addEventListener('click', async (event) => {
        event.preventDefault();
        const previousGame = await getMostRecentGame(sessionToken);
        localStorage.setItem('gameId', previousGame.id)
        location.reload();
    });
    
    startMultiplayerGame.addEventListener('click', async (e) => {
        const codeLength = codeLengthInput.value === "" ? '4' : codeLengthInput.value;
        const waitingMessage = document.getElementById('multiplayer-waiting-message');
        waitingMessage.textContent = 'Waiting to start game...'
        waitingMessage.style.display ='block';

        await multiPlayerGameFunction(sessionToken, codeLength);
    });
    
} else if (sessionToken && gameId && role !== 'codeMaster') {
    // do something
    const currentGame = await getGame(gameId);
    const masterCodeLength = currentGame.masterCodeLength;

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

    const errorMessage = document.createElement('p');
    errorMessage.setAttribute('class', 'error-message');

    const guessForm = document.getElementById('guess-form');
    guessForm.style.display = 'flex';
    const guessInput = document.getElementById('guess-input');

    guessInput.setAttribute('placeholder', `Enter your ${masterCodeLength} digit guess between 1 & 6 here.`);
    
    const nearMatchesElement = document.createElement('p');
    const exactMatchesElement = document.createElement('p');
    guessForm.append(nearMatchesElement);
    guessForm.append(exactMatchesElement);
    guessForm.append(errorMessage);

    guessForm.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    const submitGuessButton = document.getElementById('submit-guess-button');
    
    submitGuessButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const guess = guessInput.value;
        const game = gameId;

        if (!role) {
            try {
                const userGuess = await checkGuess(guess, sessionToken, game);
                const {exactMatches,nearMatches} = userGuess;
                const previousGuessElement = document.createElement("li");
                previousGuessElement.textContent = (nearMatches !== undefined &&  exactMatches !== undefined) ? `Guess: ${guess}, Exact Matches: ${exactMatches}, Near Matches: ${nearMatches}` : `Final Guess: ${guess}, you have completed the game!`;
                previousGuessesList.appendChild(previousGuessElement);
                errorMessage.textContent = "";
            } catch(error) {
                errorMessage.textContent = error.message;
            }
        } else {
            const partyId = localStorage.getItem('partyId');
            
            socket.send(JSON.stringify({
                type:'sendGuess',
                payload: {
                    guess, 
                    gameId, 
                    sessionToken,
                    partyId
                }
            }));

            guessForm.style.display = 'none';
            const multiplayerGameDiv = document.getElementById('multiplayer-game-div');
            multiplayerGameDiv.style.display = 'block';
            const waitingMessage = document.getElementById('waiting-message');
            waitingMessage.textContent = 'Waiting for other player';
        };
    }
);
    

    const endGameEarlyButton = document.getElementById('end-game-early-button');
    endGameEarlyButton.style.display = 'block';

    if (currentGame.completedGame) {
        const completedGameMessage = document.createElement('p');
        completedGameMessage.textContent = 'You have completed this game!';
        currentGameDiv.appendChild(completedGameMessage);
        localStorage.removeItem('gameId');
    };

    endGameEarlyButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameId) {
            localStorage.removeItem('gameId');
        }
        console.log('Clicking button');
        location.reload();
    });
};


    