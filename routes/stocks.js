import koaRouter from '@koa/router';
import {
    getHistoricalData,
    getQuote,
    renewAccessToken,
} from '../lib/kite-connect';

const router = new koaRouter();
router.prefix('/stocks');

router.get('/load-historical-data', (ctx) => {
    getHistoricalData();
    ctx.status = 200;
});

router.get('/track-stocks', (ctx) => {
    getQuote();
    // renewAccessToken();
    ctx.status = 200;
});

export default router;
