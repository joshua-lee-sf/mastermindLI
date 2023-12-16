import crypto from 'crypto';

export default class Party {
    static partyJoiningQueue = [];
    static parties = {};
    // parties = {partyId}
    
    constructor(player1, player2){
        this.codeMaster = player1;
        this.codeBreaker = player2;
        this.partyId = this.#generatePartyID();
    };

    #generatePartyID(){
        let id = crypto.randomBytes(16).toString('base64url');
        
        if (Party.parties[id]) {
            return this.#generatePartyID();
        };

        return id;
    };

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
};