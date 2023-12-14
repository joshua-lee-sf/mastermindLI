import { getCurrentGame } from "../../../controllers/games";

export const startNewGame = async (sessionToken, codeLength=4) => {
    try{
        const res = await fetch('http://localhost:3000/api/games/newgame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionToken,
                codeLength
            })
        });
        if (!res.ok) {
            throw new Error('Faled to start the game');
        };
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('Error', err.message);
    };
};

export const getGame = async (gameId) => {
    const res = await fetch(`http://localhost:3000/api/games/getcurrentgame?gameId=${gameId}`);
    if (!res.ok) {
        throw new Error('could not find game');
    };

    const data = res.json();
    return data;
};

export const getMostRecentGame = async (sessionToken) => {
    const res = await fetch(`http://localhost:3000/api/games/mostrecentgame?sessionToken=${sessionToken}`);

    if (!res.ok) {
        throw new Error('Could not continue previous game');
    };

    const data = await res.json();
    return data;
};

export const checkGuess = async (guess, sessionToken, game) => {
    const res = await fetch('http://localhost:3000/api/games/checkguess', {
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
        throw new Error('Could not check guess');
    }

    const data = await res.json();
    return data;
};

