import { Router } from "express";
import {checkGuess, createNewGame, endGameEarly, getAllGames, getCurrentGame, getMostRecentGame, updateGameHistory} from '../controllers/games.js';

const gameRouter = Router();

gameRouter.post('/newgame', createNewGame);
gameRouter.post('/checkguess', checkGuess);
gameRouter.post('/updategamehistory', updateGameHistory);
gameRouter.get('/mostrecentgame', getMostRecentGame);
gameRouter.post('/endGameEarly', endGameEarly);
gameRouter.get('/getcurrentgame', getCurrentGame);
gameRouter.get('/', getAllGames);



export default gameRouter;