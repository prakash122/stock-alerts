import mongoose from 'mongoose';

export const stockPriceSchema = new mongoose.Schema({
    name: String,
    startTime: Date,
    endTime: Date,
    createdAt: { type: Date, default: Date.now },
    open: Number,
    close: Number,
    high: Number,
    low: Number,
    volume: Number,
});
