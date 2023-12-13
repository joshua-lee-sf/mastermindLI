import User from "../models/User.js";
import Game from "../models/Game.js";
import _ from 'lodash';
import { getCurrentUser } from "./users.js";

const isValidGuess = (guess, masterCode) => {
    if (guess.length !== masterCode.length) return new Error('inValid Guess');

    return !!(guess.match(/^[0-7]+$/));
};

const createMasterCode = async (num=4) => {
    const res = await fetch(`https://www.random.org/integers/?num=${num}&min=1&max=6&col=1&base=10&format=plain&rnd=new`);
    const data = await res.text();
    const masterCode = data.replace(/\n/g, "");
    return masterCode;
};

const isWon = (guess, masterCode) => {
    return guess.toUpperCase() === masterCode.toUpperCase() || numExactMatches(guess, masterCode) === masterCode.length
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
        };
    };
    return count;
};

export const createNewGame = async (req, res, next) => {
    const user = await User.findOne({sessionToken: req.body.sessionToken});
    const codeLength = req.body.codeLength;

    if (user) {
        const newGame = new Game({
            completedGame: false,
            masterCode: await createMasterCode(codeLength),
            players: [user.id],
            previousGuesses: [],
            attemptsLeft: 10,
        });

        if (newGame) {
            await newGame.save();
            user.gameHistory.push(newGame.id);
            await user.save();
            res.status(200).json({
                success: true,
                data: newGame.id,
            });
        } else {
            next(new Error('Unable to create Game'));
        }
    } else {
        next(new Error('Unable to locate user'));
    };
};

export const checkGuess = async (req, res, next) => {
    const guess = req.body.guess;
    const currentGame = await Game.findOne({_id: req.body.game});
    const validGuess = isValidGuess(guess, currentGame.masterCode);
    const alreadyGeussed = currentGame.previousGuesses.includes(guess);

    if (alreadyGeussed) {
        next(new Error ('Code has been tried before'));
    }

    if (currentGame.completedGame) {
        next(new Error('Game is already completed'));
    };
    
    if (currentGame && (validGuess === true) && currentGame.attemptsLeft > 0 && !alreadyGeussed) {
        const masterCode = currentGame.masterCode;
        const nearMatches = numNearMatches(guess, masterCode);
        const exactMatches = numExactMatches(guess, masterCode);
        currentGame.previousGuesses.push(guess);
        if (isWon(guess, masterCode)) {
            currentGame.completedGame = true
            await currentGame.save();
            res.status(200).send({
                message: 'You have won the game!',
                game: currentGame
            });
        } else {
            res.status(200).json({
                success:true,
                game: currentGame._id,
                guess: guess,
                nearMatches: nearMatches,
                exactMatches: exactMatches
            });
        };
        currentGame.attemptsLeft -= 1;

        if (currentGame.attemptsLeft === 0) {
            currentGame.completedGame = true;
        };
        
        await currentGame.save();
    } else {
        next( validGuess ? validGuess : new Error('Could Not Find Game'));
    }
};

const lostGame = (game) => {
    if (game.attemptsLeft === 0) {
        game.completedGame = true;
    };
};

export const endGameEarly = async (req,res,next) => {
    const currentGame = await Game.findById(req.body.game);
    const completedGame = currentGame.completedGame;

    if (currentGame && !completedGame) {
        currentGame.completedGame = true
        await currentGame.save()
        res.json({
            message: "Ended the game early"
        })
    } else {
        next(new Error('Could not end game early'));
    }
};

export const getMostRecentGame = async(req,res,next) => {
    const user = await User.findOne({sessionToken: req.body.sessionToken});

    if (user) {
        const mostRecentGameIndex = user.gameHistory.length - 1
        const mostRecentGameId = user.gameHistory[mostRecentGameIndex];
        const mostRecentGame = await Game.findById(mostRecentGameId);
        const {id, completedGame, previousGuesses, attemptsLeft} = mostRecentGame;

        if (mostRecentGame) {
            res.status(200).json({
                id,
                completedGame, 
                previousGuesses,
                attemptsLeft,
            })
        } else {
            next(new Error('Could not Find game'));
        }
    } else {
        next(new Error('Count not find user'))
    }
};

export const getAllGames = async (req, res, next) => {
    const user = await getCurrentUser(req.session.user);

    if (user) {
        const gamesArray = await Game.find({
            '_id': {
                $in: user.gameHistory
            }
        });
        const games = gamesArray.map((game) => _.pick(game, ['_id','completedGame', 'previousGuesses', 'attemptsLeft']));
        res.json({ 
            games
        });
    } else {
        next( new Error('Could not find user'));
    };
};

// WEBSOCKET FUNCTIONS

const computerAnalyzer = (
    humanNearMatches, humanExactMatches, 
    computerNearMatches, computerExactMatches
) => {
    return humanNearMatches === computerNearMatches 
        && humanExactMatches === computerExactMatches;
};

// export const webSocketCreateGame = async (sessionToken, masterCode) => {
//     const user = await User.findOne({sessionToken});

//     if (!user) throw new Error ('User not found');

//     const newGame = new Game({
//         completedGame: false,
//         masterCode,
//         players: [user.id],
//         previousGuesses: [],
//         attemptsLeft: 10,
//     });

//     user.gameHistory.push(newGame.id);
//     await user.save();
//     await newGame.save();
// };

export const webSocketSendGuess = async (guess, gameId, sessionToken) => {
    const user = await User.findOne({sessionToken});
    const game = await game.findById(gameId);

    if (!game.players.includes(user.id)) game.players.push(user.id);
    return {guess};
};

export const webSocketCodeMasterAnalyze = async (gameId, guess, sessionToken, humanExactMatches, humanNearMatches) => {
    
    const user = await User.findOne({sessionToken});
    const game = await Game.findById(gameId);
    const masterCode = game.masterCode;

    if (game.attemptsLeft === 0 || !isValidGuess(guess, masterCode) || game.completedGame || game.previousGuesses.includes(guess)) {
        return {
            error: 'Could not check guess!'
        };
    };
    
    const computerExactMatches = numExactMatches(guess, masterCode);
    const computerNearMatches = numNearMatches(guess, masterCode);
    const comparator = computerAnalyzer(
        humanNearMatches, humanExactMatches,
        computerNearMatches,computerExactMatches
    );

    if (!comparator) {
        return {
            error: 'Human has analyzed incorrectly'
        };
    };


    if (humanExactMatches !== masterCode.length) {
        game.previousGuesses.push(guess);
        game.attemptsLeft -= 1;
        await game.save();
        return {humanExactMatches, humanNearMatches};
    } else {
        game.completedGame = true;
        await game.save();
        return {message: 'You have won!'};
    };
};