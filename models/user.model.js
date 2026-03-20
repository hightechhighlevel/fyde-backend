var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        tgId: {
            type: String,
            required: [true, "Insert Tg Id."],
        },
        userName: {
            type: String,
            default: "",
        },
        firstName: {
            type: String,
            default: "",
        },
        lastName: {
            type: String,
            default: "",
        },
        totalPoints: {
            type: Number,
            default: 0.000,
        },
        curPoints: {
            type: Number,
            default: 0.000,
        },
        countDown: {
            type: Number,
            default: 0,
        },
        lastLogin: {
            type: Date,
            default: Date.now(),
        },
        blurTime: {
            type: Date,
            default: Date.now(),
        },
        isClaimed: {
            type: Boolean,
            default: false,
        },
        transactions: [{
            type: String,
            required: false //
        }],
        inviteLink: {
            type: String,
            default: "",
        },
        availableInviteCount: {
            type: Number,
            default: 7,
        },
        status: {
            type: String,
            default: "Waiting", //Waiting to claim, Mining
        },
        isInvited: {
            type: Boolean,
            default: false
        },
        friendPoints: {
            type: Number,
            default: 0.000
        },
        friends: [{
            type: String,
            required: true
        }],
        task: [{
            type: String,
            required: true
        }],
        intervalId: {
            type: Number,
            default: 0,
        },
        claimMessageTime: {
            type: Date,
            default: Date.now(),
        },
    },
    {
        timestamps: true,
    }
);

mongoose.model("User", UserSchema, "user");
