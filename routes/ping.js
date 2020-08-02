import koaRouter from '@koa/router';
const router = new koaRouter();

router.get('/ping', (ctx) => {
    ctx.status = 200;
    ctx.body = 'pong';
});

export default router;
