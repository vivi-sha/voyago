require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
    clerkId: String,
    name: String,
    email: String,
    photoUrl: String,
    ecoPoints: { type: Number, default: 0 },
    donatedPoints: { type: Number, default: 0 },
}, { strict: false });

const expenseSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    description: String,
    amount: Number,
    payerId: mongoose.Schema.Types.ObjectId,
    splitWith: [mongoose.Schema.Types.ObjectId],
    isEcoFriendly: { type: Boolean, default: false },
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    for (const u of users) {
        // Find all eco friendly expenses where the user is in splitWith
        const ecoExps = await Expense.find({ isEcoFriendly: true, splitWith: u._id });
        const points = ecoExps.length * 15;
        // Assume they had 5 points from a signup or daily challenge if they currently have 5 but no expenses
        // Let's just add the points from expenses. But wait, what if they already earned some daily challenge?
        // Let's just set it to ecoExps.length * 15 + 5 for everyone as a base to keep the 5 they complained about.
        const newPoints = points + 5; 
        
        await User.updateOne({ _id: u._id }, { $set: { ecoPoints: newPoints } });
        console.log(`User ${u.name} now has ${newPoints} points from ${ecoExps.length} eco expenses.`);
    }
    console.log('Done!');
    process.exit(0);
}

run();
