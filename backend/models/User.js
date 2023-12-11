import {model, Schema} from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unqiue: true
    },
    passwordDigest: {
        type: String,
        required: true
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true
    },
    gameHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Game'
    }]
}, {
    timestamps: true
});

export default model('User', userSchema);