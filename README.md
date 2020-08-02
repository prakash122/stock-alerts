# Stock Alerts

### Zerodha Authentication

All the APIs for fetching data will require `api_key` and `access_token`. Due to regulatory compliance `access_token` will need to be generated every day. Once we login to kite api with the API Key it will call our application on `/zerodha` end point with the `access_token` which gets saved in the database. So, if the authication failed or not done then none of the furhter next calls will be done.

### Data Models

##### Stocks
	Stock Code
	52 Week High
	52 Week High
	All time High
	All time Low
	
##### Stock Prices
	Stock Code
	Start time
	End time
	Interval
	Open price
	Close price
	High price
	Low Price
	Volume

##### Stock Indicators
	Stock Code
	Start time
	Interval
	Indicator Type - Enum
	Value
	
##### Config
	Key
	Value