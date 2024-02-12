const samcoApiCall = require('../server'); // Assuming samcoApiCall is exported from server.js
const upsertDBlog = require('../db'); // Assuming upsertDBlog is exported from db.js

exports.handleAlert = async (alert) => {
    // Split the stocks string into an array
    const stocks = alert.stocks.split(',');

    let maxVolume = 0;
    let maxVolumeTradingSymbol = '';
    let optionType = '';

    // Loop through each stock
    for (let i = 0; i < stocks.length; i++) {
        // Fetch the options data for the stock
        const optionsData = await samcoApiCall('optionChain', `?exchange=NFO&searchSymbolName=${stocks[i]}`);

        // Loop through each option
        for (let detail of optionsData.optionChainDetails) {
            let volume = parseInt(detail.volume, 10);

            // If this option has a higher volume than the current max, update the max
            if (volume > maxVolume) {
                maxVolume = volume;
                maxVolumeTradingSymbol = detail.tradingSymbol;
                optionType = detail.optionType;
            }
        }
    }

    // Place the order
    const order = {
        symbolName: maxVolumeTradingSymbol,
        exchange: 'NFO',
        transactionType: 'BUY',
        orderType: 'SL',
        quantity: '1',
        orderValidity: 'DAY',
        productType: 'MIS',
        price: '1',
        priceType: 'LTP',
        triggerPrice: '0.99',
        afterMarketOrderFlag: 'NO'
    };

    const response = await samcoApiCall('placeOrder', order);

    // Log the response
    console.log(response);

    // Return the response
    return response;
};

async function samcoApiCall(ApiName, ReqData) {
    console.log('samcoApiCall', ApiName);
  //   cl(isPapertrade);
      if((await findFromDB('MasterConfig',{type:'isPapertrading'},'value'))) return samcoApiPapertrade(ApiName,ReqData);
    if (sn.snapi.sessionToken == undefined) await loginSamco({});
    const headers = {
      'Content-Type': 'application/json',
      'x-session-token': sn.snapi.sessionToken
    };
    let url = 'https://api.stocknote.com';
    try {
     // console.log(url + '/order/' + ApiName + ReqData);
  
      let response = {};
      if (ApiName == 'placeOrder') response = await axios.post(url + '/order/' + ApiName, ReqData, { headers: headers });
      else if (ApiName == 'getQuote') response = await axios.get(url + '/quote/' + ApiName + ReqData, { headers: headers });
      else if (ApiName == 'getLimits') response = await axios.get(url + '/limit/' + ApiName + ReqData, { headers: headers });
      else if (ApiName == 'optionChain') response = await axios.get(url + '/option/' + ApiName + ReqData, { headers: headers });
      else if (ApiName == 'getPositions') response = await axios.get(url + '/position/' + ApiName + '?positionType=DAY' + ReqData, { headers: headers });
      else if (ApiName == 'orderBook') response = await axios.get(url + '/order/' + ApiName + ReqData, { headers: headers });
      else if (ApiName == 'cancelOrder') response = await axios.delete(url + '/order/' + ApiName + ReqData, { headers: headers });
      
     // console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(`Error: ${error}`);
      throw error;
    }
  }   