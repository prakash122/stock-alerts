const appConfig = {
    zerodha: {
        apiKey: process.env.KITE_API_KEY,
        apiSecret: process.env.KITE_API_SECRET,
    },
    slack: {
        hookUrl: process.env.SLACK_HOOK_URL,
    },
};

export { appConfig };
