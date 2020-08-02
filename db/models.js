import mongoose from 'mongoose';
import { stockSchema } from './schemas/stock.schema';
import { configSchema } from './schemas/config.schema';
import { stockPriceSchema } from './schemas/stock-price.schema';
import { stockIndicatorSchema } from './schemas/stock-indicator.schema';

export const Stock = mongoose.model('stocks', stockSchema);
export const Config = mongoose.model('configs', configSchema);
export const StockPrice = mongoose.model('stockPrices', stockPriceSchema);
export const StockIndicator = mongoose.model(
    'stockIndicators',
    stockIndicatorSchema
);
