import { KiteConnect } from 'kiteconnect';
import { appConfig } from '../config';
import { Config } from '../db/models';
import { KITE_RESPONSE_KEY } from '../constants/config-keys.const';
import { notifyOnSlack } from './slack-notifier';
import { getStockNamesToTrack } from './stock-tracker';
import _ from 'lodash';
import { StockPrice } from '../db/models';
import addDuration from 'date-fns/add';
import PromisePool from 'es6-promise-pool';

const kiteInstance = new KiteConnect({
    api_key: appConfig.zerodha.apiKey,
});

const _wrapEx = async (asyncPromise) => {
    try {
        return await asyncPromise;
    } catch (error) {
        notifyOnSlack('Error fetching a quote :' + error.message);
        notifyOnSlack('For relogin. Please login to ' + getZerodhaLoginUrl());
    }
};

const initializeSession = async (requestToken) => {
    try {
        const result = await kiteInstance.generateSession(
            requestToken,
            appConfig.zerodha.apiSecret
        );
        await storeKiteReponse(result);
    } catch (e) {
        console.error(e);
    }
};

const getZerodhaLoginUrl = () => kiteInstance.getLoginURL();

const initKite = async () => {
    const authResponse = await loadAuthResponse();
    if (!authResponse) {
        notifyOnSlack(
            'No token found. Please login to ' + getZerodhaLoginUrl()
        );
        return;
    }
    kiteInstance.setAccessToken(authResponse.access_token);
};

const storeKiteReponse = async (token) => {
    const query = { key: KITE_RESPONSE_KEY };
    const newData = {
        key: KITE_RESPONSE_KEY,
        value: token,
    };
    const accessTokenRecord = await Config.findOneAndUpdate(query, newData, {
        upsert: true,
    }).exec();
};

const loadAuthResponse = async () => {
    const query = { key: KITE_RESPONSE_KEY };
    const record = await Config.findOne(query).exec();
    return record ? record.value : null;
};

const getHistoricalData = async () => {
    const stockNameMap = {};

    // Load instruments and get instrument_token with trading symbol
    const instruments = await _wrapEx(kiteInstance.getInstruments('NSE'));
    instruments.forEach((instrument) => {
        stockNameMap[instrument.tradingsymbol] = instrument.instrument_token;
    });
    const stocksToTrack = Object.keys(stockNameMap);
    const concurrency = 2;
    const currentDate = new Date();
    let counter = 0;
    const generatePromises = function () {
        if (counter >= Object.keys(stockNameMap).length) return null;

        const tradingSymbol = stocksToTrack[counter++];
        return _wrapEx(
            kiteInstance.getHistoricalData(
                stockNameMap[tradingSymbol],
                '15minute',
                addDuration(currentDate, { days: -200 }),
                currentDate
            )
        )
            .then((history) => {
                if (!Array.isArray(history)) return Promise.resolve();
                const modelRecords = history.map((record) => ({
                    ...record,
                    startTime: new Date(record.date),
                    endTime: addDuration(new Date(record.date), {
                        minutes: 15,
                    }),
                    name: tradingSymbol,
                }));
                return StockPrice.insertMany(modelRecords);
            })
            .then(() => {
                return new Promise((resolve) => {
                    console.log('Completed and processed', tradingSymbol);
                    resolve();
                });
            });
    };

    const pool = new PromisePool(generatePromises, concurrency);
    try {
        await pool.start();
    } catch (error) {
        console.error('Error while running the promises', error);
    }
};

const getQuote = async () => {
    const quote = await _wrapEx(kiteInstance.getQuote(['AAVAS:NSE']));
    console.log(quote);
    return quote;
};

const renewAccessToken = async () => {
    try {
        const authResponse = await loadAuthResponse();
        const newData = await kiteInstance.renewAccessToken(
            authResponse.refresh_token,
            appConfig.zerodha.apiSecret
        );
    } catch (e) {
        console.error(e);
    }
};

export {
    initKite,
    initializeSession,
    getZerodhaLoginUrl,
    getHistoricalData,
    getQuote,
    renewAccessToken,
};
