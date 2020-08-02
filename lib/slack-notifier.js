import axios from 'axios';
import { appConfig } from '../config';

export const notifyOnSlack = async (message) => {
    const data = {
        channel: 'stock-notifications',
        username: 'stock-alerts',
        icon_emoji: ':ghost:',
        text: message,
    };

    try {
        await axios.post(appConfig.slack.hookUrl, data);
    } catch (error) {
        console.error('Error notifying via slack', error);
    }
};
