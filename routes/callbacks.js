import koaRouter from '@koa/router';
import { initializeSession, getZerodhaLoginUrl } from '../lib/kite-connect';
const router = new koaRouter();

// Referrer will be https://kite.zerodha.com/connect/login?api_key=<API_KEY>&sess_id=<SESSION_ID>
// End Point will be "localhost:3000/zerodha?request_token=g5uCSN44DLSdw9YMvio3YEvFMMG4R8z7&action=login&status=success"
// curl "localhost:3000/zerodha?request_token=QMnj5Thau2IEbVd95CM7Q4DpOXJ9Wgrz&action=login&status=success"
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
