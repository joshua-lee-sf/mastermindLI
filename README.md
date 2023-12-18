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
3. [Create a Mongo Database](https://www.mongodb.com/basics/create-database#:~:text=Collections%20can%20be%20created%20just,you%20will%20see%20your%20database.) and then set up a ```.env``` file adding your [MongoURI](https://www.mongodb.com/basics/mongodb-connection-string#:~:text=The%20MongoDB%20connection%20string%20for,port%20number%20you%20are%20using.).
4. Run: ```npm run start``` from root directory
5. Run: ```npm run watch``` from frontend directory
6. Open ```http://localhost:3000``` in browser
7. Play the game!
    + a. I have accounts created please user them. They are in username:password format or create your own.
        * usertest:password
        * testuser:password
    + b. To use the multiplayer aspect, open another incognito window and log onto ```http://localhost:3000``` and click "Start New Multiplayer Game".

## Discussion

Building this game was relatively straight forward, until it came to websockets. The Backend was built with an Express server. Sessions were handled using Express Sessions and localStorage within the Client itself.

If you're reading through each of the code snippets, I also added comments into the lines of code that I think are important.

Let's go ahead and get started!

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

As you can see, I used a Mongo Database. I also used the MVC framework along with Mongoose to make easy use of reading and writing to my database. By desisgn, MongoDB is non-relational, however, I added references so some sort of ownership would show through references to other tables / collections.

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

For the single player aspect of the game, I used regular HTTP methods / requests. Users would send a request and the server would send a response. The client would then display information depending on what the response was.

Here is a request function to the server.
```js
export const getMostRecentGame = async(req,res,next) => {
    const user = await User.findOne({sessionToken: req.query.sessionToken});

    if (user) {
        const mostRecentGameIndex = user.gameHistory.length - 1
        const mostRecentGameId = user.gameHistory[mostRecentGameIndex];
        const mostRecentGame = await Game.findById(mostRecentGameId);
        const {id, completedGame, previousGuesses, attemptsLeft} = mostRecentGame;
        const masterCodeLength = mostRecentGame.masterCode.length;

        if (mostRecentGame) {
            res.status(200).json({
                id,
                completedGame, 
                previousGuesses,
                attemptsLeft,
                masterCodeLength,
            })
        } else {
            next(new Error('Could not find game'));
        }
    } else {
        next(new Error('Could not find user'))
    }
};
```

Here is the middleware created to be used by the client.

```js
export const getGame = async (gameId) => {
    const res = await fetch(`/api/games/getcurrentgame?gameId=${gameId}`);
    if (!res.ok) {
        throw new Error('could not find game');
    };

    const data = await res.json();
    return data;
};
```
And here is a call from certain front end methods using the middleware and displaying the information.

```js
} else if (sessionToken && gameId && role !== 'codeMaster') {
    // most APIs return a promise so when getting any information from them, the functions must be awaited
    const currentGame = await getGame(gameId);
    const masterCodeLength = currentGame.masterCodeLength;

    localStorage.setItem('mastercodeLength', masterCodeLength);

    const currentGameDiv = document.getElementById('current-game-div');
    currentGameDiv.style.display = 'flex';

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

    guessForm.style.display = 'flex';

    // setting attributes to display information dynamically based on what information is returned from the backend.
    guessInput.setAttribute('placeholder', `Enter your ${masterCodeLength} digit guess between 1 & 6 here.`);
```

For the browser portion, I used Vanilla JavaScript to manipulate the DOM. However, that took a lot longer. I thought it would be more simple but with the addition of websockets, it made it extremely difficult. 

### WebSockets
In order to make this game a multiplayer game, I needed to figure out the best way for clients to "talk" to each other in real time that was quick, had low latency, and accurate. I decided to use WebSockets, specifically an NPM library of WebSockets, 'ws'.

There were many things I had to do, I had to think about the steps of the game, and then I had to figure out what each player's role was in the game and figure out the steps from there.

Here are the steps that I took and why.

This is me initializing the WebSocket server and setting up different eventListeners for the event that occurred. In order for WebSockets to function properly, requests had to be "upgraded" and that can be done either manually or automatically depending on what's best for your application. I decided to upgrade them automatically since I was relatively new to WebSockets and didn't really understand how to use them to their fullest capabilities. As you can see below, the code that's automatically upgrading the WebSocket is the ```wss = new WebSocketServer({server})``` part. It's automatically listening to all of the requests being made in my server and if any needed to be "upgraded" to WebSockets, it did it for me automatically.

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

    // Event listener for what to do when the WebSocket connection was closed. In this particular part, if a person closed the connection while in Queue, I also removed them from queue.
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

WS does not directly connect with other clients (p2p). To my knowledge, the client has to communicate to the backend server, the server decides what to do next, and sends the response directly to the other client. 

In this example, the client first establishes a connection with the server, the server then responds saying that a connection has been established, and a game started. Then the server sends the new game information back to the second client, and a game is started through that. 
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
        
        // the user's socket then sends the "guess" and all relative information to the backend to be processed.
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
        
        // which will process the guess and send it back to the server to send to the codeMaster's client.
        codeMaster.send(JSON.stringify({
            type: 'sendGuess',
            payload: {
                guess
            }
        }));
    };

```

Websockets are incredibly difficult to work with and I wish I had more time to do a deeper dive into the technology and to learn more. However, they're quick, versatile, and fun to use. If enough planning is set up, I think WS can be used super efficiently.

### Oversights / Changes To Be Made

In the future, if I had more time, I would create direct test files and test rigorously. I did a lot of manual testing through running code blocks, postman, and physically testing the game and the different edge cases, however, automating that testing process would have helped a lot more.

I would refactor a lot of the code I have. A lot of the code I wrote was to immediately get something on paper and get it working quickly. I wasn't able to keep my code super DRY.

I definitely want to continue working with WebSockets and learning it more in depth.

I won't use Vanilla JavaScript for the frontend. I read "simple" in the instructions and thought okay, I shouldn't deal with components and stuff, but now a single page website that rerenders based on change would've been a lot faster to implement.

## Ending / Leaving Comments
Thanks so much for making me do this projet. I learned a lot of valuable lessons while doing this project that I will definitely use during my career. Thank you for looking at through this project and I appreciate any feedback! I'm relatively new to coding so I want to learn as much as possible from other experienced engineers.
