import { Router } from "express";
import {checkGuess, createNewGame, endGameEarly, getAllGames, getMostRecentGame} from '../controllers/games.js';

const gameRouter = Router();

gameRouter.post('/newgame', createNewGame);
gameRouter.post('/checkguess', checkGuess);
gameRouter.get('/mostrecentgame', getMostRecentGame);
gameRouter.post('/endGameEarly', endGameEarly);
gameRouter.get('/', getAllGames);



export default gameRouter;