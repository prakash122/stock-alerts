import { KiteConnect } from 'kiteconnect';
import { appConfig } from '../config';
import { Config } from '../db/models';
import { KITE_RESPONSE_KEY } from '../constants/config-keys.const';
import { notifyOnSlack } from './slack-notifier';
import { getStockNamesToTrack } from './stock-tracker';
import _ from 'lodash';

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
    const stocksToTrack = getStockNamesToTrack();
    const stockNameMap = {};
    stocksToTrack.forEach((name) => (stockNameMap[name] = true));
    // Load instruments and get instrument_token with trading symbol
    const instruments = await _wrapEx(kiteInstance.getInstruments('NSE'));
    instruments.forEach((instrument) => {
        if (stockNameMap[instrument.tradingsymbol]) {
            stockNameMap[instrument.tradingsymbol] =
                instrument.instrument_token;
        }
    });
    try {
        // Trying to historical data of Aavas. we pass the instrument token
        const history = await _wrapEx(
            kiteInstance.getHistoricalData(
                stockNameMap[stocksToTrack[0]],
                '15 min',
                new Date('2020-07-15 00:00:00'),
                new Date('2020-07-30 00:00:00')
            )
        );
        console.log('history', history);
    } catch (e) {
        console.error(e);
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
