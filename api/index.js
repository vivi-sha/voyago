const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// MongoDB Connection (cached for serverless)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('MONGODB_URI environment variable is not set!');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Connect on startup
connectDB();

// --- Schemas ---

const userSchema = new mongoose.Schema({
    clerkId: String,
    name: String,
    email: { type: String, unique: true },
    photoUrl: String,
    ecoPoints: { type: Number, default: 0 },
    donatedPoints: { type: Number, default: 0 },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const tripSchema = new mongoose.Schema({
    name: String,
    destination: String,
    creatorId: mongoose.Schema.Types.ObjectId,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shareCode: { type: String, default: () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }},
    date: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const expenseSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    description: String,
    amount: Number,
    payerId: mongoose.Schema.Types.ObjectId,
    splitWith: [mongoose.Schema.Types.ObjectId],
    isEcoFriendly: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

// --- Routes ---

app.get('/', (req, res) => res.send('Voyago Backend Active'));

app.get('/api', (req, res) => {
    res.json({ message: 'Voyago API is running!' });
});

// Protect all /api routes
app.use('/api', ClerkExpressRequireAuth({}));

// Custom error handler for unauthenticated requests
app.use((err, req, res, next) => {
    if (err.message === 'Unauthenticated' || err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthenticated' });
    }
    next(err);
});

// Sync User with Backend
app.post('/api/auth/google', async (req, res) => {
    await connectDB();
    console.log('Received auth sync request:', req.body);
    try {
        const { clerkId, name, email, photoUrl } = req.body;
        let user = await User.findOne({ clerkId });
        
        if (!user && email) {
            user = await User.findOne({ email });
        }

        if (!user) {
            user = new User({ clerkId, name, email, photoUrl });
            await user.save();
            console.log('Created new user:', user.email);
        } else {
            user.clerkId = clerkId;
            user.name = name;
            user.photoUrl = photoUrl;
            await user.save();
            console.log('Updated existing user:', user.email);
        }
        res.json(user);
    } catch (error) {
        console.error('Auth sync error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get Single User
app.get('/api/users/:id', async (req, res) => {
    await connectDB();
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Leaderboard
app.get('/api/users', async (req, res) => {
    await connectDB();
    try {
        const users = await User.find().sort({ ecoPoints: -1 }).limit(20);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Award points to user
app.post('/api/users/:id/add-points', async (req, res) => {
    await connectDB();
    try {
        const { points, reason } = req.body;
        const user = await User.findOneAndUpdate(
            { $or: [{ clerkId: req.params.id }, { _id: req.params.id }] },
            { $inc: { ecoPoints: points || 0 } },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Trips Routes
app.get('/api/trips', async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.query;
        const trips = await Trip.find({ members: userId }).sort({ date: -1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Trip
app.post('/api/trips', async (req, res) => {
    await connectDB();
    try {
        const { name, destination, creatorId } = req.body;
        const trip = new Trip({
            name,
            destination,
            creatorId,
            members: [creatorId]
        });
        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join Trip
app.post('/api/trips/join', async (req, res) => {
    await connectDB();
    try {
        const { shareCode, userId } = req.body;
        const trip = await Trip.findOne({ shareCode });
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        
        if (!trip.members.includes(userId)) {
            trip.members.push(userId);
            await trip.save();
        }
        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Trip Details (Single Trip)
app.get('/api/trips/:id', async (req, res) => {
    await connectDB();
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Expenses
app.get('/api/expenses', async (req, res) => {
    await connectDB();
    try {
        const { tripId, payerId } = req.query;
        let filter = {};
        if (tripId) filter.tripId = tripId;
        if (payerId) filter.payerId = payerId;
        
        const expenses = await Expense.find(filter).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Expense
app.post('/api/expenses', async (req, res) => {
    await connectDB();
    try {
        const expense = new Expense(req.body);
        await expense.save();
        
        // Award Eco Points if applicable
        if (expense.isEcoFriendly) {
            await User.findByIdAndUpdate(expense.payerId, {
                $inc: { ecoPoints: 10 }
            });
        }
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Expense
app.put('/api/expenses/:id', async (req, res) => {
    await connectDB();
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Expense
app.delete('/api/expenses/:id', async (req, res) => {
    await connectDB();
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        
        // Remove eco points if it was eco-friendly
        if (expense.isEcoFriendly) {
            await User.findByIdAndUpdate(expense.payerId, {
                $inc: { ecoPoints: -10 }
            });
        }
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
