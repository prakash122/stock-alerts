import koaRouter from '@koa/router';
import { initializeSession, getZerodhaLoginUrl } from '../lib/kite-connect';
const router = new koaRouter();

// Referrer will be https://kite.zerodha.com/connect/login?api_key=<API_KEY>&sess_id=<SESSION_ID>
// curl "localhost:3000/zerodha?request_token=<TOKEN>&action=login&status=success"
router.get('/zerodha', (ctx) => {
    if (ctx.query.request_token) {
        initializeSession(ctx.query.request_token);
    } else {
        console.log(getZerodhaLoginUrl());
        return ctx.redirect(getZerodhaLoginUrl());
    }

    ctx.status = 200;
    ctx.body = 'Successful';
});

export default router;
