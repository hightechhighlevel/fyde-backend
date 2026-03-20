process.env.NODE_ENV = process.env.NODE_ENV || "development";
var mongoose = require("mongoose"),
    User = mongoose.model("User");
const handleError = require("../config/utils/handleError");
const catchAsync = require("../config/utils/catchAsync");
const { Telegraf, Markup } = require("telegraf");
const { v4: uuidv4 } = require('uuid');
var cron = require('node-cron');

const bot = new Telegraf("");
const desText = `
With Fyde 🔥, you can harness AI to lock in gains and generate yield to grow your crypto stack faster. 

Our Telegram mini app is now live! Start FARMING today and discover the amazing rewards that await you! 🎁

Got more friends? Bring them along to join the Fyde Club! First rule of Fyde Club: Tell everyone about Fyde Club! 🥊

Remember: You're joining us before Fyde's TGE, where endless opportunities are ahead! 🎉
`;
const cert = "Made with ❤️ by Fyde Team";
const cycleTime = 10;

const admins = ['bozhangles', 'BehrinN', 'carlosnoesaavedra', 'EneoHollenbach', 'Yawa3891']

cron.schedule(`*/${cycleTime} * * * *`, async () => {
    let someUsers = await User.find({ status: { $ne: "Waiting" } });
    await Promise.all(
        someUsers.map(async (user, index) => {
            const currentTime = new Date();
            let preTime = user.blurTime;
            let preCountDown = user.countDown;
            let diffMillis = currentTime.getTime() - preTime.getTime();
            let diffSeconds = Math.floor(diffMillis / 1000);
            let countDown = preCountDown - diffSeconds;
            if (!user.isClaimed && countDown < 0 && user.status != "Messaged") {
                user.status = "Messaged";
                user.claimMessageTime = new Date();
                await user.save();
                await bot.telegram.sendMessage(user.tgId, "Congratulations! It's time to claim your points and reap the rewards! 🎁", {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {
                                    text: 'Claim Now',
                                    web_app: {
                                        url: "https://bot.fyde.fi"
                                    }
                                }
                            ]
                        ]
                    })
                });
            }
            else if (!user.isClaimed && countDown < 0 && user.status == "Messaged") {
                let prevTime = user.claimMessageTime;
                let curTime = new Date();
                let diffInHours = Math.abs(curTime - prevTime) / (1000 * 60 * 60);
                if (diffInHours >= 12) {
                    user.claimMessageTime = new Date();
                    await user.save();
                    await bot.telegram.sendMessage(user.tgId, "Congratulations! It's time to claim your points and reap the rewards! 🎁", {
                        reply_markup: JSON.stringify({
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Claim Now',
                                        web_app: {
                                            url: "https://bot.fyde.fi"
                                        }
                                    }
                                ]
                            ]
                        })
                    });
                }
            }

        })
    );
});

exports.getUser = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { firstName, lastName, userName, countLimit, start_param } = req.body;
    try {
        const user = await User.findOne({ tgId: tgId })
        if (user) {
            if (user.status != "Waiting") {
                const currentTime = new Date();
                let preTime = user.blurTime;
                let preCountDown = user.countDown;
                if (preCountDown == 0) {
                    preCountDown = 10 * 60;
                }
                let diffMillis = currentTime.getTime() - preTime.getTime();
                // Convert milliseconds to seconds
                let diffSeconds = Math.floor(diffMillis / 1000);
                let countDown = preCountDown - diffSeconds;
                if (user.isClaimed && countDown < 0) {
                    countDown = 0;
                    user.curPoints = 0;
                }
                else if (!user.isClaimed && countDown < 0) {
                    countDown = 0;
                    diffSeconds = countLimit;
                    user.curPoints = 0.002 * diffSeconds;
                    user.status = "Waiting to claim";
                }
                else {
                    user.curPoints += 0.002 * diffSeconds;
                }
                user.countDown = countDown;
                await user.save();
                return res.status(200).send({ user });
            }
            else {
                return res.status(200).send({ user });
            }
        } else {
            let inviteLink = uuidv4();
            if (start_param) {
                const owner = await User.findOne({ inviteLink: start_param });
                if (owner) {
                    User.create({ tgId, userName, firstName, lastName, isInvited: true, inviteLink })
                        .then(async (user) => {
                            if (owner.friends.includes(tgId)) {
                                await owner.save();
                            }
                            else {
                                if (!admins.includes(owner.userName)) {
                                    owner.availableInviteCount -= 1;
                                }
                                owner.friends.push(tgId);
                                await owner.save();
                            }
                            await bot.telegram.sendMessage(owner.tgId, `@${user.userName} has joined your Matchain crypto farm! 🌱🚀Get ready for more fun together! 👥💪`, {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [
                                            {
                                                text: 'Claim Now',
                                                web_app: {
                                                    url: "https://bot.fyde.fi"
                                                }
                                            }
                                        ]
                                    ]
                                })
                            });
                            return res.status(200).send({ user });
                        })
                        .catch((err) => {
                            handleError(err, res);
                        });
                }
                else {
                    return res.status(400).send("Unauthorized Invitation Link!");
                }
            }
            else {
                User.create({ tgId, userName, firstName, lastName, inviteLink })
                    .then((user) => {
                        return res.status(200).send({ user });
                    })
                    .catch((err) => {
                        handleError(err, res);
                    });
            }
        }
    }
    catch (err) {
        handleError(err, res);
    };

});

exports.getFriends = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    try {
        const user = await User.findOne({ tgId: tgId });
        let friends = user.friends;
        let friendsInfo = [];
        let totalFriendPoints = 0.0;
        console.log("friends", friends);
        if (friends) {
            await Promise.all(friends.map(async (friend, index) => {
                let nFriend = await User.findOne({ tgId: friend });
                if (nFriend) {
                    console.log("exist friends=======>");
                    friendsInfo.push(nFriend);
                    totalFriendPoints += nFriend.friendPoints;
                }
                else {
                    console.log("no friends=======>");
                }
            }));
            console.log("===>friendsInfo", friendsInfo);
            return res.status(200).send({
                availableInviteCount: user.availableInviteCount,
                inviteLink: user.inviteLink,
                friendsInfo: friendsInfo,
                totalFriendPoints: totalFriendPoints
            });
        }
        else {
            return res.status(200).send({});
        }
    }
    catch (err) {
        handleError(err, res);
    };
});

exports.updateBlurTime = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { countDown, points } = req.body;
    try {
        const currentTime = new Date();
        const result = await User.findOneAndUpdate(
            { tgId: tgId }, // Filter
            { $set: { blurTime: currentTime, countDown: countDown, curPoints: points } }, // Update
            { new: true } // Options
        );
        if (!result) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send(result);
    } catch (err) {
        handleError(err, res);
    }
});

exports.updatePoints = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { points } = req.body;
    console.log("putPoints========>", points);
    try {
        await bot.telegram.sendMessage(tgId, "🌾 New farming is live! Farm more, earn more! 💰", {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: 'Start New Farming',
                            web_app: {
                                url: "https://bot.fyde.fi"
                            }
                        }
                    ]
                ]
            })
        });
        const user = await User.findOne({ tgId: tgId });
        user.totalPoints += points;
        user.curPoints = 0;
        user.isClaimed = true;
        user.countDown = 0;
        user.status = "Waiting";
        if (user.isInvited) {
            user.friendPoints += points * 0.1;
        }
        await user.save();
        return res.status(200).send(user);
    } catch (err) {
        handleError(err, res);
    }
});

exports.updateTask = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { id } = req.body;
    try {
        const user = await User.findOne({ tgId: tgId });

        let tasks = user.task;
        if (!tasks.includes(id)) {
            user.task.push(id);
            if (id == "all") {
                user.totalPoints += 200;
            }
            else if (id != "deposit") {
                user.totalPoints += 100;
            }
            await user.save();
            return res.status(200).send(true);
        }
        else {
            return res.status(200).send(false);
        }
    } catch (err) {
        handleError(err, res);
    }
});

exports.updateFriendPoints = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { totalFriendPoints } = req.body;

    console.log("putPoints========>", totalFriendPoints);
    try {
        const user = await User.findOne({ tgId: tgId });
        if (user) {
            user.totalPoints += totalFriendPoints;
            await user.save();
            await Promise.all(user.friends.map(async (friend, index) => {
                const nFriend = await User.findOne({ tgId: friend });
                if (nFriend) {
                    nFriend.friendPoints = 0;
                    await nFriend.save();
                }
            }));
            return res.status(200).send();
        }
        else {
            return res.status(400).send("User Not Found");
        }
    } catch (err) {
        handleError(err, res);
    }
});

exports.updateTransaction = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { transactionId, points } = req.body;
    try {
        const user = await User.findOne({ tgId: tgId });
        if (user) {
            let transactions = user.transactions;
            if (!transactions.includes(transactionId)) {
                user.totalPoints += points;
                transactions.push(transactionId);
                user.transactions = transactions;
                const paramPoint = useState("referral system", []);
                const highMH = paramPoint - updatedSum;
                await user.save();
                await bot.telegram.sendMessage(tgId, "🌾 New farming is live! Farm more, earn more! 💰", {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {
                                    text: 'Start New Farming',
                                    web_app: {
                                        url: "https://bot.fyde.fi"
                                    }
                                }
                            ]
                        ]
                    })
                });
                return res.status(200).send(true);
            }
            else {
                return res.status(200).send(false);
            }
        }
        else {
            return res.status(404).send("User Not Found");
        }
    } catch (err) {
        handleError(err, res);
    }
});

exports.updateClaimStatus = catchAsync(async (req, res) => {
    let tgId = req.params.id;
    let { id } = req.body;
    try {
        const result = await User.findOneAndUpdate(
            { tgId: tgId }, // Filter
            { $set: { isClaimed: false, status: "Farming", blurTime: new Date(), intervalId: id } }, // Update
            { new: true } // Options
        );
        if (!result) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send(result);
    } catch (err) {
        handleError(err, res);
    }
});

bot.command("start", (ctx) => {
    return ctx.reply(
        `${desText}\n${cert}`,
        Markup.inlineKeyboard([
            Markup.button.webApp(
                `💻Launch Fyde`,
                "https://bot.fyde.fi"
            ),
            Markup.button.url(
                `🌐Website`,
                "https://www.fyde.fi/"
            ),
        ])
    );
});

bot.on("message", (ctx) => {

})

bot.launch();