import crypto from 'node:crypto';

export default class Party {
    static partyJoiningQueue = [];
    static parties = {};
    
    constructor(player1, player2){
        this.codeMaster = player1;
        this.codeBreaker = player2;
        this.partyId = this.#generatePartyID();
    }

    #generatePartyID(){
        let id = crypto.randomBytes(16).toString('base64url');
        
        if (Party.parties[id]) {
            return this.#generatePartyID();
        };

        return id;
    };

    static creatingParty(player1) {
        const queue = this.partyJoiningQueue;
        queue.push(player1);
        if (queue.length >= 2) {
            const player1 = queue.shift();
            const player2 = queue.shift();
            const newParty = new this(player1, player2);
            this.parties[newParty.partyId] = newParty; 
        };
    };
};