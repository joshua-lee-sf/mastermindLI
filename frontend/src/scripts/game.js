import { getCurrentGame } from "../../../controllers/games";

const errorMessage = document.createElement('p');
errorMessage.setAttribute('class', 'error-message');

export const startNewGame = async (sessionToken, codeLength, masterCode, partyId) => {
    try{
        const res = await fetch('/api/games/newgame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionToken,
                codeLength,
                masterCode,
                partyId
            })
        });
        if (!res.ok) {
            return new Error('Faled to start the game');
        };

        const data = await res.json();
        const waitingMessage = document.getElementById('waiting-message');
        waitingMessage.textContent = 'Waiting for other player...';
    
        const roleAssignmentElement = document.getElementById('role-assignment');
        const masterCodeInputElement = document.getElementById('mastercode-input');
        const submitMasterCodeButtonElement = document.getElementById('submit-mastercode-button');
        roleAssignmentElement.style.display = 'none';
        masterCodeInputElement.style.display = 'none';
        submitMasterCodeButtonElement.style.display = 'none';
        return data;
    } catch (err) {
        document.body.appendChild(errorMessage);
        errorMessage.textContent = err.message;
    };
};

export const getGame = async (gameId) => {
    const res = await fetch(`/api/games/getcurrentgame?gameId=${gameId}`);
    if (!res.ok) {
        throw new Error('could not find game');
    };

    const data = await res.json();
    return data;
};

export const getMostRecentGame = async (sessionToken) => {
    const res = await fetch(`/api/games/mostrecentgame?sessionToken=${sessionToken}`);

    if (!res.ok) {
        throw new Error('Could not continue previous game');
    };

    const data = await res.json();
    return data;
};

export const checkGuess = async (guess, sessionToken, game, partyId, humanExactMatch, humanNearMatch) => {
    if (partyId) {
        const res = await fetch('/api/games/checkguess', {
            method: 'POST',
            headers:{
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                guess,
                sessionToken,
                game,
                partyId,
                humanExactMatch,
                humanNearMatch,
            })
        });
        if (!res.ok) {
            const {error} = await res.json();
            throw new Error(error);
        }
        const data = await res.json();
        return data;

    } else {
        const res = await fetch('/api/games/checkguess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guess,
                sessionToken,
                game,
            })
        });
        if (!res.ok) {
            const {error} = await res.json();
            throw new Error(error);
        }
        const data = await res.json();
        return data;
    }
};

export const updateGameHistory = async (gameId, sessionToken) => {
    const res = await fetch('/api/games/updategamehistory', {
        method: 'POST',
        body: JSON.stringify({
            gameId,
            sessionToken
        }),
        headers: {
            'content-type': 'application/json'
        }
    });

    if (!res.ok) {
        const {error} = await res.json();
        throw new Error(error);
    };

    const data = await res.json();
    return data;
};
