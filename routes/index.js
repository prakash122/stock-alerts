import koaRouter from '@koa/router';

import pingRouter from './ping';
import callRouter from './callbacks';
import stocksRouter from './stocks';

const registerRoutes = (app) => {
    const routers = [pingRouter, callRouter, stocksRouter];
    routers.forEach((router) => {
        app.use(router.routes());
        app.use(router.allowedMethods());
    });
};

export { registerRoutes };
