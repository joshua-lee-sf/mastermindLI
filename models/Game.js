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