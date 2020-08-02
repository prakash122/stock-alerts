import mongoose from 'mongoose';
mongoose.set('useFindAndModify', false);

const initializeDb = (callback) => {
    mongoose.connect('mongodb://localhost/stock-alerts', {
        useNewUrlParser: true,
    });
    const db = mongoose.connection;
    db.on('error', () => console.error('connection error:'));
    db.once('open', function () {
        console.log('Connected to Database');
        callback(null, db);
    });
};

export { initializeDb };
