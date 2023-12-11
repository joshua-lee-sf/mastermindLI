import User from "../models/User.js";
import Game from "../models/Game.js";
import _ from 'lodash';
import { getCurrentUser } from "./users.js";

const createNewGame = async (req, res, next) => {
    const user = await User.findOne({sessionToken: req.body.sessionToken});

    if (user) {
        const newGame = new Game({
            completedGame: false,
            masterCode: await createMasterCode(),
            player: user.id,
            previousGuesses: [],
        });

        if (newGame) {
            await newGame.save();
            user.gameHistory.push(newGame.id);
            await user.save();
            res.status(200).json({
                success: true,
                data: newGame,
            })
        } else {
            return new Error('Unable to create Game');
        }
    } else {
        return new Error('Unable to locate user');
    }
};

const isValidGuess = (guess) => {
    if (guess.length > 4) return new Error('inValid Guess');
    let numberString = '01234567';

    for (let i = 0; i < guess.length; i++) {
        if (!numberString.includes(guess[i])) {
            return new Error('inValid Guess');
        }
    }

    return true;
};

const checkGuess = async (req, res, next) => {
    const guess = req.body.guess;
    const currentGame = await Game.findOne({_id: req.body.game});
    const validGuess = isValidGuess(guess);

    if (currentGame.completedGame) {
        next(new Error('Game is already completed'));
    } else if (currentGame && (validGuess === true)) {
        const masterCode = currentGame.masterCode;
        
    }
}

const createMasterCode = async () => {
    const res = await fetch('https://www.random.org/integers/?num=4&min=1&max=6&col=1&base=10&format=plain&rnd=new')
    const data = await res.text();
    const masterCode = data.replace(/\n/g, "");
    return masterCode
};

const numNearMatches = (guess, masterCode) => {
    const guessDup = guess.split('').slice();
    const masterCodeDup = masterCode.split('').slice();
    let i = 0;

    while (i < guessDup.length) {
        if (guessDup[i] === masterCodeDup[i] ) {
            guessDup[i] = null;
            masterCodeDup[i] = null;
        };
        i++;
    };

    let count = 0;
    for (let j = 0; j < guessDup.length; j++) {
        let curr = guessDup[j];
        if (masterCodeDup.includes(curr) && curr !== null) {
            let index = masterCodeDup.indexOf(curr);
            masterCodeDup[index] = null;
            count++;
        };
    };

    return count;
};

const numExactMatches = (guess, masterGuess) => {
    if (guess.length !== masterGuess.length) return false;
    let count = 0;
    for (let i = 0; i < guess.length; i++) {
        if (guess[i].toUpperCase() === masterGuess[i].toUpperCase()) {
            count++;
        }
    };
    return count;
};