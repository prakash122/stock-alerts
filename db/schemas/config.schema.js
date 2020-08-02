import mongoose from 'mongoose';

export const configSchema = new mongoose.Schema({
    key: String,
    value: Object,
});
