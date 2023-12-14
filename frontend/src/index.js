import { getCurrentGame } from "../../controllers/games.js";
import { loginUser, createUser, getCurrentUser } from "../src/scripts/user.js";
import { getGame, getMostRecentGame, startNewGame, checkGuess, onGoingGameFunction, startNewGameFunction } from "./scripts/game.js";

const userOptions = async () => {
    const sessionToken = localStorage.getItem('sessionToken');

    let userOptions = document.getElementById('nav-right');

    if (!sessionToken) {
        let usernameInput = document.createElement('input');
        usernameInput.setAttribute('type', 'text');
        usernameInput.placeholder = 'Username';
        userOptions.appendChild(usernameInput);
        
        let passwordInput = document.createElement('input');
        passwordInput.setAttribute('type', 'password');
        passwordInput.placeholder = 'Password';
        userOptions.appendChild(passwordInput);
        
        let loginBUtton = document.createElement('button');
        loginBUtton.textContent = 'Login';
        userOptions.appendChild(loginBUtton);

        loginBUtton.addEventListener('click', async (event) => {
            event.preventDefault();
            await loginUser(usernameInput.value, passwordInput.value);
        })

        let createUserButton = document.createElement('button');
        createUserButton.textContent = 'Create User';
        userOptions.appendChild(createUserButton);
        createUserButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await createUser(usernameInput.value, passwordInput.value)
        })

    } else {
        const user = await getCurrentUser(sessionToken);
        const userName = user.username;

        let loggedInDiv = document.createElement('div');
        userOptions.appendChild(loggedInDiv);

        let userNameElement = document.createElement('p');
        userNameElement.textContent = 'Hello ' + userName;
        userNameElement.setAttribute('id', 'username');
        loggedInDiv.appendChild(userNameElement);

        let logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.setAttribute('id', 'logout-button');
        loggedInDiv.appendChild(logoutButton);

        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('sessionToken');
            location.reload();
        });
    };
};

const gameFunction = async () => {
    const gameId = localStorage.getItem('gameId');
    const sessionToken = localStorage.getItem('sessionToken');

    if (!gameId && sessionToken) {
        const gameOptionsDiv = document.createElement('div');
        gameOptionsDiv.setAttribute('id', 'game-options-div');
        document.body.appendChild(gameOptionsDiv);

        const codeLengthLabel = document.createElement('label');
        codeLengthLabel.textContent = 'Code Length: ';
        gameOptionsDiv.appendChild(codeLengthLabel);

        const codeLengthInput = document.createElement('input');
        codeLengthInput.setAttribute('type', 'text')
        codeLengthInput.setAttribute('placeholder', 'default = 4');
        codeLengthLabel.appendChild(codeLengthInput);

        const buttonDiv = document.createElement('div');
        buttonDiv.setAttribute('id', 'button-div');
        gameOptionsDiv.appendChild(buttonDiv);

        const startSinglePlayerGameButton = document.createElement('button');
        startSinglePlayerGameButton.textContent = 'Play against computer';
        buttonDiv.appendChild(startSinglePlayerGameButton);

        startSinglePlayerGameButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const codeLength = codeLengthInput.value !== "" ? parseInt(codeLengthInput.value) : 4;
            console.log(codeLength, 'value');
            const game = await startNewGame(sessionToken, codeLengthInput.value);
            localStorage.setItem('gameId', game.data);
            location.reload();
        });

        const continuePreviousGame = document.createElement('button');
        continuePreviousGame.textContent = 'Continue previous game';
        buttonDiv.appendChild(continuePreviousGame);

        continuePreviousGame.addEventListener('click', async (event) => {
            event.preventDefault();
            const previousGame = await getMostRecentGame(sessionToken);
            localStorage.setItem('gameId', previousGame.id)
            location.reload();
        })
    } else {
        // do something
        const currentGame = await getGame(gameId);
        const masterCodeLength = currentGame.masterCodeLength;

        const currentGameTitle = document.createElement('h2');
        currentGameTitle.textContent = 'Current Game: ';

        const currentGameDiv = document.createElement('div');
        currentGameDiv.setAttribute('id', 'current-game-div')
        document.body.appendChild(currentGameDiv);
        currentGameDiv.appendChild(currentGameTitle);

        const previousGuessesList = document.createElement('ul');
        currentGameTitle.append(previousGuessesList);
        const previousGuessesArray = currentGame?.previousGuesses;

        if (previousGuessesArray.length > 0) {
            previousGuessesArray.forEach((previousGuess) => {
                const previousGuessElement = document.createElement("li");
                previousGuessElement.textContent = previousGuess;
                previousGuessesList.appendChild(previousGuessElement);
            })
        } else {
            const noGuesses = document.createElement('p');
            noGuesses.textContent = 'No guesses yet. Please make a guess.';
            previousGuessesList.appendChild(noGuesses);
        };

        const guessForm = document.createElement('form');
        document.body.appendChild(guessForm);
        const guessInput = document.createElement('input');
        guessForm.appendChild(guessInput);
        guessInput.setAttribute('type', 'text');
        guessInput.setAttribute('placeholder', `Enter your ${masterCodeLength} digit guess here`);
        guessInput.setAttribute('required', 'true');
        
        const submitGuessButton = document.createElement('button');
        submitGuessButton.textContent = 'Submit Guess';
        guessForm.appendChild(submitGuessButton)
        const nearMatchesElement = document.createElement('p');
        const exactMatchesElement = document.createElement('p');
        guessForm.append(nearMatchesElement);
        guessForm.append(exactMatchesElement);
        

        submitGuessButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const guess = guessInput.value;
            const sessionToken = localStorage.getItem('sessionToken');
            const game = gameId;
            const userGuess = await checkGuess(guess, sessionToken, game);
            const {exactMatches,nearMatches} = userGuess;
            exactMatchesElement.textContent = 'Exact matches: ' + exactMatches;
            nearMatchesElement.textContent = 'Near matches: ' + nearMatches;
            location.reload();
        });

        if (currentGame.completedGame) {
            const completedGameMessage = document.createElement('p');
            completedGameMessage.textContent = 'You have completed this game!';
            currentGameDiv.appendChild(completedGameMessage);
            localStorage.removeItem('gameId');
            await startNewGameFunction();
        }
    };
}

await userOptions();
await gameFunction();