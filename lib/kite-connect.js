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
        throw error;
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
const INTERVALS = {
    minute: 'minute',
    minute3: '3minute',
    minute5: '5minute',
    minute10: '10minute',
    minute15: '15minute',
    minute30: '30minute',
    minute60: '60minute',
    day: 'day',
};
const getDurationForInterval = (interval) => {
    switch (interval) {
        case INTERVALS.day:
            return { days: -2000 };
        case INTERVALS.minute60:
            return { days: -400 };
        case INTERVALS.minute15:
        default:
            return { days: -200 };
    }
};
const getNumberFromInterval = (interval) => {
    switch (interval) {
        case INTERVALS.day:
            return { days: 1 };
        case INTERVALS.minute60:
            return { minutes: 60 };
        case INTERVALS.minute15:
            return { minutes: 15 };
        default:
            throw new Error(
                'Interval is not recognized (getNumberFromInterval) - ' +
                    interval
            );
    }
};

const getHistoricalDataForTradingSymbols = async (
    tradingSymTokenMap,
    interval
) => {
    const tradingSymbolList = Object.keys(tradingSymTokenMap);
    const concurrency = 1;
    const currentDate = new Date();
    let counter = 0;
    const generatePromises = function () {
        if (counter >= tradingSymbolList.length) return null;
        const tradingSymbol = tradingSymbolList[counter++];
        return _wrapEx(
            kiteInstance.getHistoricalData(
                tradingSymTokenMap[tradingSymbol],
                interval,
                addDuration(currentDate, getDurationForInterval(interval)),
                currentDate
            )
        )
            .then((history) => {
                if (!Array.isArray(history)) return Promise.resolve();
                const modelRecords = history.map((record) => ({
                    ...record,
                    startTime: new Date(record.date),
                    endTime: addDuration(
                        new Date(record.date),
                        getNumberFromInterval(interval)
                    ),
                    interval,
                    name: tradingSymbol,
                }));
                return StockPrice.insertMany(modelRecords);
            })
            .then(() => {
                return new Promise((resolve) => {
                    console.log(
                        'Completed and processed',
                        tradingSymbol,
                        interval
                    );
                    setTimeout(() => {
                        resolve();
                        // rate limit for history API is 120 requests for min
                    }, 500);
                });
            })
            .catch(() => {
                console.error('Failed', tradingSymbol, interval);
            });
    };

    const pool = new PromisePool(generatePromises, concurrency);
    return pool.start();
};

const getHistoricalData = async () => {
    const stocksToTrack = getStockNamesToTrack();
    const stockNameMap = {};

    stocksToTrack.forEach(
        (tradingSymbol) => (stockNameMap[tradingSymbol] = true)
    );
    // Load instruments and get instrument_token with trading symbol
    const instruments = await _wrapEx(kiteInstance.getInstruments('NSE'));

    instruments.forEach((instrument) => {
        if (stockNameMap[instrument.tradingsymbol])
            stockNameMap[instrument.tradingsymbol] =
                instrument.instrument_token;
    });
    try {
        await getHistoricalDataForTradingSymbols(stockNameMap, INTERVALS.day);
        await getHistoricalDataForTradingSymbols(
            stockNameMap,
            INTERVALS.minute60
        );
        await getHistoricalDataForTradingSymbols(
            stockNameMap,
            INTERVALS.minute15
        );
    } catch (error) {
        console.log('Errors for stockNameMap', stockNameMap);
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
