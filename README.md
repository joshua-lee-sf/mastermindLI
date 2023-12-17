# Mastermind 

Welcome to my mastermind project! I'm incredibly proud of this project and would love for you to take a look at it.

## Technologies used:
* Node.js

### Backend: 
* Express
* MongoDB
* Express-Sessions
* WebSockets / 'ws' JavaScript Library

### Frontend:
* Vanilla JavaScript

## Quick Start
1. Clone this repo: ``` git clone https://github.com/joshua-lee-sf/mastermindLI.git```
2. Install dependencies for both frontend and backend directories: 
```cd frontend npm install```
```cd .. backend npm install```
3. Run: ```npm run start``` from root directory
4. Run: ```npm run watch``` from frontend directory
5. Open ```http://localhost:3000``` in browser
6. Play the game!

## Discussion

Building this game was relatively simple, until it came to websockets. The Backend was built with a simple Express server. 

Here's a snippet of the Express server:
```js
const app = Express();

// Express Session Config
app.use(session({
    secret: 'linkedin mastermind password',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: app.get('env') === 'production'}
}));

app.use('/dist', Express.static('frontend/dist'));
app.use('/', Express.static('frontend/public'));

app.use('/api/users', userRouter);
app.use('/api/games', gameRouter);

// universal error handler
app.use((error, req, res, next) => {
    console.log(error, "error");
    res.status(400).json({
        error: error.message
    });
});

// Creating Websocket Server and connecting HTTP server to it for the automatic 'upgrade'
const server = app.listen(port, () => console.log(`Now listening on port ${port}`));
const wss = new WebSocketServer({server});
```

As you can see, I used a MongoDB database. I also used the MVC framework along with Mongoose to make easy use of reading and writing to my database. I designed it be to non-relational, but has some sort of ownership through references.

Here is an example of the game's model:
```JS
import { model, Schema } from 'mongoose';

const gameSchema = new Schema({
    completedGame: {
        type: Boolean,
        required: true,
    },
    attemptsLeft: {
        type: Number,
        max: 10,
        required: true,
    },
    masterCode: {
        type: String,
        maxlength: 10,
        minlength: 2,
        required: true,
    },
    previousGuesses: {
        // guess, near matches, exact matches
        type: Array,
        of: String,
    },
    players: {
        type: Array,
        of: Schema.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

export default model('Game', gameSchema);
```

Using Mongoose's built in methods, I was able to quickly and easily set up the database, and I'm able to search the database using ORM methods like ```User.findOne({information})```. 

After building the models, I built the controllers:
```JS
export const createNewGame = async (req, res, next) => {
    // Search for the user the user
    const user = await User.findOne({sessionToken: req.body.sessionToken});

    // Destructure other variables from the request body sent from the client
    const {codeLength, masterCode, partyId} = req.body;
    
    if (user) {
        const newGame = new Game({
            completedGame: false,
            masterCode: masterCode ?? await createMasterCode(codeLength),
            players: [user.id],
            previousGuesses: [],
            attemptsLeft: 10,
        });

        if (newGame) {
            await newGame.save();
            // add the specific game to the user's game history and save 
            user.gameHistory.push(newGame.id);
            await user.save();

            // run different code if it's a multiplayer game
            if (partyId) {
                const {codeBreaker} = Party.parties[partyId];

                codeBreaker.send(JSON.stringify({
                    type: 'sendGameId',
                    payload: {
                        gameId: newGame.id,
                    },
                }))
            };
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
```

After setting up the controller, I set up the routes. The routes are built the way they are because at any given moment, I wanted users to ONLY be able to look up their own information and I saved their session token in the local storage so that was easy to look up and I didn't have to deal with any parameters in the URL / URI.
```js
gameRouter.post('/updategamehistory', updateGameHistory);
gameRouter.get('/mostrecentgame', getMostRecentGame);
gameRouter.post('/endGameEarly', endGameEarly);
gameRouter.get('/getcurrentgame', getCurrentGame);
```

After setting up the backend, I used JavaScripts Fetch API to build middleware to run my APIs so that users are abstracted away, and keeps a sepration of tasks.
```js
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
        console.error('Error', err.message);
    };
};
```
For the browser portion, I used Vanilla JavaScript to manipulate the DOM. However, that took a lot longer. I thought it would be more simple but with the addition of websockets, it made it extremely difficult. 

### WebSockets
In order to make this game a multiplayer game, I needed to figure out the best way for clients to "talk" to each other in real time that was quick, had low latency, and accurate. I decided to use WebSockets, specifically an NPM library of WebSockets, 'ws'.

There were many things I had to do, I had to think about the steps of the game, and then I had to figure out what each player's role was in the game and figure out the steps from there.

Here are the steps that I took and why.

This is me initializing the WebSocket server and setting up different eventListeners for the event that occurred. Pretty self explanatory stuff here. I also allowed ws to look at all of my requests and update them automatically as needed.

```js
const server = app.listen(port, () => console.log(`Now listening on port ${port}`));
const wss = new WebSocketServer({server});

// starts the connection
wss.on('connection', function connection(ws) {
    console.log('A new client Connected!');

    // When a message is recieved, run the incomingMessage function and bind (the websocket user);
    ws.on('message', incomingMessage.bind(null, ws));
    
    // Creating a new instance of a Party class which was established when 2 or more people joined the "queue"
    const party = Party.creatingParty(ws);

    // Event listener for what to do when the WebSocket connection was closed. In this particular part, if a person closed the connection while in Queue, we also removed them from queue.
    ws.on('close', () => {
        const index = Party.partyJoiningQueue.indexOf(ws);
        if (index > -1) {
            Party.partyJoiningQueue.splice(index, 1)
        }; 
    });
});
```


After a user joins the WebSocket server, a user is added to a queue to join a party. Once 2 or more people join that queue, a new instance is made and a connection between the two clients are established.
```js
    static async creatingParty(player1 ) {
        const queue = this.partyJoiningQueue;
        queue.push(player1);

        if (queue.length >= 2) {
            const player1 = queue.shift();
            const player2 = queue.shift();
            const newParty = new this(player1, player2);

            this.parties[newParty.partyId] = newParty; 
            
            player1.send(JSON.stringify({
                type:'notifyPlayer',
                payload: {
                    role: 'codeMaster',
                    partyId: newParty.partyId,
                }
            }));

            player2.send(JSON.stringify({
                type:'notifyPlayer',
                payload: {
                    role: 'codeBreaker',
                    partyId: newParty.partyId,
                }
            }))
        };
    };
```

Like all protocols, WebSockets have their own "methods" in a sense. However, that is all custom built. I tailored mine towards the mastermind type game and have routes depending on what part of the game it is. As you can see below, I have a switch statement looking at the ```payload.type```. Depending on the type, the server will decide which function to call and how to process that message.
```js
    switch (parsedMessage.type) {
        case 'echo':
            echo(ws, message);
            break;
        case 'sendGuess':
            sendGuess(ws, parsedMessage.payload);
            break;
        case 'checkGuess':
            checkGuess(ws, parsedMessage.payload);
            break;
        case 'notifyCodeMaster':
            notifyCodeMaster(ws);
            break;
        case 'notifyCodeBreaker':
            notifyCodeBreaker();
            break;
        default:
            ws.send(JSON.stringify({
                error: 'Invalid Message Type'
            }));
    };
```

WS do not directly connect with other clients (p2p). To my knowledge, the client has to communicate to the backend server, the server decides what to do next, and sends the response directly to the other client. 

In this example, the client first establishes a connection with the server, the server then responds saying that a connection has established, and a game has been started. Then the server sends thew new game information back to the second client, and a game is started through that. 
```js
    // a user makes a guess and sends it to our checkguess middleware
    if (!role) {
        try {
            const userGuess = await checkGuess(guess, sessionToken, game);
            const {exactMatches,nearMatches} = userGuess;
            exactMatchesElement.textContent = 'Exact matches: ' + exactMatches;
            nearMatchesElement.textContent = 'Near matches: ' + nearMatches;
        } catch(error) {
            errorMessage.textContent = error.message;
        }
    } else {
        const partyId = localStorage.getItem('partyId')
        
        // the user's socket then sends the "guess" and all relative information tot he backend to be processed.
        socket.send(JSON.stringify({
            type:'sendGuess',
            payload: {
                guess, 
                gameId, 
                sessionToken,
                partyId
            }
        }));

        // the Switch tells it to run the "sendGuess" method
        case 'sendGuess':
            sendGuess(ws, parsedMessage.payload);
            break;

        // which will entail run this method:
        const sendGuess = async (ws, payload) => {
        if (typeof payload !== 'object') {
            ws.send(JSON.stringify({
                error: 'Not an object!'
            }));
        };

        const {guess, gameId, sessionToken, partyId} = payload;

        const game = await game.findById(gameId);
        const user = await User.findOne({sessionToken});

        const {codeMaster} = Party.parties[partyId];

        if (!game.players.includes(user.id)) game.players.push(user.id);
        
        codeMaster.send(JSON.stringify({
            type: 'sendGuess',
            payload: {
                guess
            }
        }));
    };

    // which will process the guess and send it back to the server to send to the codeMaster's client.
```

Websockets are incredibly difficult to work with and I wish I had more time to do a deeper dive into the technology and to learn more. However, they're quick, versatile, and fun to use. If enough planning is set up, I think WS can be used super efficiently.

### Oversights / Changes To Be Made

In the future, if I had more time and a longer deadline with more training, I would create more test files and test rigorously. I did a lot of manual testing through running code blocks, postman, and physically testing the game and the different edge cases, however, automating that testing process would have helped a lot more.

I would refactor a lot of the code I have. A lot of the code I wrote was to immediately get something on paper and get it working quickly. I wasn't able to keep my code super DRY.

I definitely want to continue working with WebSockets and learning it more in depth.

I won't use Vanilla JavaScript for the frontend. I read "simple" in the instructions and though okay, I shouldn't deal with components and stuff, but now a single page website that rerenders based on change would've been a lot faster to implement.


