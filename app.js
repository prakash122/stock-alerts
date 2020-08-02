import koa from 'koa'; // koa@2
import koaBody from 'koa-bodyparser';
import { initializeDb } from './db';
import { initKite } from './lib/kite-connect';

initializeDb(() => {
    // Sets the access token if available will send a slack notification
    initKite();

    // After the Db connection we initialize the server
    const app = new koa();
    app.use(koaBody());

    // Register routes in the application
    require('./routes').registerRoutes(app);

    // Listen to the port
    app.listen(3000);
});
