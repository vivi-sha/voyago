const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    proofImageBase64: String,
    proofLocation: { latitude: Number, longitude: Number },
    proofTime: Date,
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
        // Find by ObjectId if valid, else by clerkId
        let query = { clerkId: req.params.id };
        if (mongoose.isValidObjectId(req.params.id)) {
            query = { $or: [{ _id: req.params.id }, { clerkId: req.params.id }] };
        }
        
        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User Profile
app.put('/api/users/:id', async (req, res) => {
    await connectDB();
    try {
        const { name, photoUrl } = req.body;
        let query = { clerkId: req.params.id };
        if (mongoose.isValidObjectId(req.params.id)) {
            query = { $or: [{ _id: req.params.id }, { clerkId: req.params.id }] };
        }
        
        let updateData = {};
        if (name) updateData.name = name;
        if (photoUrl) updateData.photoUrl = photoUrl;

        const user = await User.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true }
        );
        
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

// Redeem Points
app.post('/api/users/:id/redeem', async (req, res) => {
    await connectDB();
    try {
        const { points, isDonation } = req.body;
        const query = { $or: [{ clerkId: req.params.id }, { _id: req.params.id }] };
        
        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.ecoPoints < points) {
            return res.status(400).json({ message: 'Insufficient points' });
        }
        
        let update = { $inc: { ecoPoints: -points } };
        if (isDonation) {
            update.$inc.donatedPoints = points;
        }

        const updatedUser = await User.findOneAndUpdate(query, update, { new: true });
        res.json(updatedUser);
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

// Deep Link Redirect for WhatsApp
app.get('/api/join/:code', (req, res) => {
    const code = req.params.code;
    const redirectUrl = req.query.redirect;
    if (redirectUrl) {
        res.redirect(redirectUrl);
    } else {
        // Redirect to Voyago APK custom scheme for production
        res.redirect(`voyago://join?code=${code}`);
    }
});

// Update Trip
app.put('/api/trips/:id', async (req, res) => {
    await connectDB();
    try {
        const { name, destination } = req.body;
        const trip = await Trip.findByIdAndUpdate(req.params.id, { name, destination }, { new: true });
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Trip
app.delete('/api/trips/:id', async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.query;
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        
        if (String(trip.creatorId) !== String(userId)) {
            return res.status(403).json({ error: 'Only the creator can delete this trip' });
        }
        
        // Delete all expenses associated with the trip
        await Expense.deleteMany({ tripId: req.params.id });
        // Delete the trip itself
        await Trip.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Trip and expenses deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Leave Trip
app.post('/api/trips/:id/leave', async (req, res) => {
    await connectDB();
    try {
        const { userId, newCreatorId } = req.body;
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        
        if (String(trip.creatorId) === String(userId)) {
            if (trip.members.length > 1 && !newCreatorId) {
                return res.status(400).json({ error: 'You must designate a new creator before leaving.' });
            }
            if (newCreatorId) {
                trip.creatorId = newCreatorId;
            }
        }
        
        trip.members = trip.members.filter(m => String(m) !== String(userId));
        
        // If no members left, delete the trip and expenses
        if (trip.members.length === 0) {
            await Expense.deleteMany({ tripId: req.params.id });
            await Trip.findByIdAndDelete(req.params.id);
            return res.json({ message: 'Trip deleted as it has no members left' });
        }
        
        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Expenses
app.get('/api/expenses', async (req, res) => {
    await connectDB();
    try {
        const { tripId, payerId, participantId } = req.query;
        let filter = {};
        if (tripId) filter.tripId = tripId;
        if (payerId) filter.payerId = payerId;
        if (participantId) filter.splitWith = participantId; // matches if array contains it
        
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
        
        // Award Eco Points to all participants if applicable
        if (expense.isEcoFriendly && expense.splitWith && expense.splitWith.length > 0) {
            const objectIds = expense.splitWith.filter(id => mongoose.isValidObjectId(id));
            const stringIds = expense.splitWith.filter(id => !mongoose.isValidObjectId(id) && typeof id === 'string');
            
            const query = [];
            if (objectIds.length > 0) query.push({ _id: { $in: objectIds } });
            // Also check objectIds against clerkId just in case some are stored as strings that look like objectIds
            query.push({ clerkId: { $in: expense.splitWith } });

            if (query.length > 0) {
                await User.updateMany(
                    { $or: query },
                    { $inc: { ecoPoints: 15 } }
                );
            }
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
        
        // Remove eco points from all participants if it was eco-friendly
        if (expense.isEcoFriendly && expense.splitWith && expense.splitWith.length > 0) {
            await User.updateMany(
                { _id: { $in: expense.splitWith } },
                { $inc: { ecoPoints: -15 } }
            );
        }
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
