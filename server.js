import express, { response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import sn from "stocknotejsbridge";
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import axios from "axios";
import {Spreadsheets} from "./config.js";
import schedule from "node-schedule";
let job;
import cron from "node-cron";
import { start } from "repl";
const app = express();
const PORT = process.env.PORT || 5001;
const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
dotenv.config();
app.use(cors());
let count=0;
function CurrentTimeOver(hrs,mins){
    const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        return (currentHour > hrs || (currentHour === hrs && currentMinute >= mins))
}
async function startcron() {
    job = schedule.scheduleJob('*/20 * * * * *',async function(){
     //   console.log('This runs every 20 seconds.');
      //  console.log(count);
        await closeTradesIfProfitOrLoss(job);
      });
}
function endcron() {
    job.cancel();
    console.log('The scheduled job has been cancelled.');
}
app.post("/testChartinkPlaceOrder", async (req, res) => {
//    closeTradesIfProfitOrLoss(); return;
  console.log(req.body);
   upsertDBlog('chartInkCalls', req.body, {uid:randomUUID()});
    const stocks = req.body.stocks.split(",");
     let Alerts = stocks.map(stock => ({"Stock": stock,"Date": new Date().toISOString().split('T')[0],"Time": new Date().toISOString()}));  
      await multipleInsertDB('Alerts',Alerts);
  let {CEsymbol,PEsymbol,exchange,quantityInLots}= await getOptionwithMaxVolume(stocks[0]);  
    //console.log(CEsymbol,PEsymbol,exchange,quantityInLots);
     let r= await placeSamcoCEPEOrder(CEsymbol,PEsymbol, exchange, quantityInLots);
    startcron(); 
    res.status(200).send({ data: "returned" });   });/*    
});
*/
async function closeTradesIfProfitOrLoss() {
    
    if(CurrentTimeOver(15,30)){} else
{        try {
            // await deleteAllDataFromCollection('Positions');
            // await deleteAllDataFromCollection('Orders');
        let positionsResponse = await samcoApiCall('getPositions', '');
        let orders = await samcoApiCall('orderBook', '');
        let Positions = positionsResponse.positionDetails.map(position => {
            return {
              "Stock": position.tradingSymbol,
              "Date": new Date().toISOString().split('T')[0],
              "Time": new Date().toISOString(),
              "Bought Price": position.averageBuyPrice,
              "Current Price": position.lastTradedPrice,
              "Pnl": position.unrealizedGainAndLoss,
              "Status": "Open"
}});
        let Orders = orders.orderBookDetails.map(order => {
                return {
                  "Stock": order.tradingSymbol,
                  "Date": new Date().toISOString().split('T')[0],
                  "Time": new Date().toISOString(),
                  "Price": order.orderPrice,
                  "Status": order.orderStatus
                }});
        await multipleInsertDB('Positions',Positions);
        await multipleInsertDB('Orders',Orders);
        
        // Call an API endpoint to get current positions
    //     let {pnl,positionDetail,maxProfit,maxLoss}= await getSamcoTotalProfitLoss();
    //    console.log(pnl,maxProfit,maxLoss);
    //     await upsertDBlog("PnL", { date:new Date().getDate ,time: new Date().toLocaleTimeString, profitLoss: pnl });
    //     // Check if the total profit is greater than 10 or the loss is less than -2
    //     if (pnl > maxProfit || pnl < maxLoss) {
    //         // Iterate over the positions and close all trades
    //         for (let pos of positionDetail) {
    //          let r= await placeSamcoMISOrder(pos.tradingSymbol, pos.exchange, pos.transactionType === 'BUY' ? 'SELL' : 'BUY', pos.netQuantity);
    //          }
    //     }
    } catch (error) {
        console.log(error);
    }
}
}

//getTradingData({Date: '2022-03-01'});
async function getTradingData(Date)
{
  let db = await dbConnect();
  let Alerts = await db.collection('Alerts').find(Date).toArray();
  let positionsResponse = await samcoApiCall('getPositions', '');
  let orders = await samcoApiCall('orderBook', '');

  let Positions = positionsResponse.positionDetails.map(position => {
      return {
        "Stock": position.tradingSymbol,
        "Date": new Date().toISOString().split('T')[0],
        "Time": new Date().toISOString(),
        "Bought Price": position.averageBuyPrice,
        "Current Price": position.lastTradedPrice,
        "Pnl": position.unrealizedGainAndLoss,
        "Status": "Open"
      }});
  let Orders = orders.orderBookDetails.map(order => {
          return {
            "Stock": order.tradingSymbol,
            "Date": new Date().toISOString().split('T')[0],
            "Time": new Date().toISOString(),
            "Price": order.orderPrice,
            "Status": order.orderStatus
          }});
  //console.log({Date:Date ,Alerts:Alerts,Orders:Orders,Positions:Positions});
  return {Alerts:Alerts,Orders:Orders,Positions:Positions};
} 
async function updateSpreadsheetWithDBData() {
    let config=Spreadsheets.TradingSetup;
// Call the function
let dte= (await getSpreadsheetData(config.id, 'Sheet1!B1'))[0][0];
console.log(dte);
    let dt= await getTradingData({Date: dte});
 updateSpreadsheetSection(config.id, config.sections[0].range , config.sections[0].columns, dt.Alerts);
 updateSpreadsheetSection(config.id, config.sections[1].range, config.sections[1].columns, dt.Orders);
 updateSpreadsheetSection(config.id, config.sections[2].range, config.sections[2].columns, dt.Positions);
} 
// This function is called when the selected date changes
async function updateSpreadsheetSection(spreadsheetId, range, columns, data) {
     const values = data.map(item => columns.map(column => item[column]));       
  const blankvalues = Array.from({ length: 16 }, () => Array(columns.length).fill('')); // Creates a 20x13 array filled with empty strings
await writeToSpreadsheetMultiple(spreadsheetId, range,blankvalues);
  await writeToSpreadsheetMultiple(spreadsheetId, range, values);
} 



























app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
export async function writeToSpreadsheet(spreadsheetId, range, value) {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED', // 'RAW' if you don't want to allow user to enter formula
        resource: {
            values: [[value]]
        }
    });
}
export async function writeToSpreadsheetMultiple(spreadsheetId, range, values) {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED', // 'RAW' if you don't want to allow user to enter formula
        resource: {
            values: values
        }
    });
}
async function getSpreadsheetData(spreadsheetId, range) {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const googleSheets = google.sheets({ version: "v4", auth: client });

    //const authClient = await authorize(); // Your authorization function to get auth client

    const request = {
      spreadsheetId: spreadsheetId,
      range: range,
      auth: auth,
    };
  
    try {
      const response = await googleSheets.spreadsheets.values.get(request);
      //console.log(response.data);
      return response.data.values; // This will return the values in the specified range.
    } catch (err) {
      console.error(err);
    }
}
let reqdata={
  "Stocks": "BIKAJI,LATENTVIEW,LTIM,SHOPERSTOP,HONAUT,BAJAJELEC",
  "trigger_prices": "414.05,347,5062.3,812.7,42368.2,1271.45",
  "triggered_at": "10:25 am",
  "scan_name": "15 minute Stock Breakouts",
  "scan_url": "15-minute-stock-breakouts",
  "alert_name": "Alert for 15 minute Stock Breakouts",
  "webhook_url": "https://us-central1-techprojects-24daa.cloudfunctions.net/app/PlaceOrderChartInk"
};
function cl(data) {
  console.log(data);
}

async function multipleInsertDB(collectionName, req) {
    try {
        const db = await dbConnect();
        const collection = db.collection(collectionName);
        const x = await collection.insertMany(req);
        return x;
    } catch (ex) {
        console.log(ex);
        return ex;
    }
    }
async function upsertDBlog(collectionName, req,filter) {
  try {
      const db = await dbConnect();
      const collection = db.collection(collectionName);
      const query = (filter)?filter:{};
      if(!req) return 'object is blank';
      req.time=new Date();
      const update = { $set: req};
      const options = { upsert: true };
      let x = await collection.updateOne(query, update, options);
      if (x.upsertedCount > 0) return cl(x.upsertedId.toHexString());     
     else if(x.modifiedCount > 0) return cl(x.modifiedCount +' documents were modified');
     else   return cl("No documents were upserted.");
     
    } catch (ex) {
      console.log(ex);
      return ex;
    }
}
//getOptionwithMaxVolume('NIFTY');

async function getOptionwithMaxVolume(symbol) {
 let optionsData = await samcoApiCall('optionChain',`?exchange=NFO&searchSymbolName=${symbol}`);
let maxVolume = 0, maxVolumeTradingSymbol = '',optionType='';
for (let detail of optionsData.optionChainDetails) {
    let volume = parseInt(detail.volume, 10);    
    if (volume > maxVolume) {
        maxVolume = volume;
        maxVolumeTradingSymbol = detail.tradingSymbol;
        optionType=detail.optionType;
    }
}
let symbolDetail = await samcoApiCall('eqDervSearch',`?exchange=NFO&searchSymbolName=${maxVolumeTradingSymbol}`);
let CEsymbol='',PEsymbol='', exchange, quantityInLots;
if(optionType=='CE')
  { 
      CEsymbol= maxVolumeTradingSymbol; 
      PEsymbol= maxVolumeTradingSymbol.replace('CE', 'PE');//TODO only in end change                
  } else 
  {  
      PEsymbol= maxVolumeTradingSymbol; 
      CEsymbol= maxVolumeTradingSymbol.replace('PE', 'CE');//TODO only in end change                
  } 

  exchange=symbolDetail.searchResults[0].exchange;
  quantityInLots=symbolDetail.searchResults[0].bodLotQuantity;
let optns = optionsData.optionChainDetails.filter(dt => dt.tradingSymbol == maxVolumeTradingSymbol);
return {CEsymbol,PEsymbol,exchange,quantityInLots,symbolDetail,optionsData};
}

//testinsertSampleData();
async function testinsertSampleData()
{
  let Alerts=[  {    "Stock": "AAPL", "Date":"2022-03-01",   "Time": "2022-03-01T10:00:00Z"},  
  {    "Stock": "NIFTY", "Date":"2022-03-01",    "Time": "2022-03-01T10:00:00Z"}];
    let Orders=[  {    "Stock": "AAPL",    "Price": 150.00,"Date":"2022-03-01","Time": "2022-03-01T10:00:00Z",    "Status": "Completed"},  
    {    "Stock": "NIFTY",    "Price": 150.00, "Date":"2022-03-01","Time": "2022-03-01T10:00:00Z",    "Status": "Completed"},
{    "Stock": "BANKNIFTY",    "Price": 150.00,"Date":"2022-03-01",     "Time": "2022-03-01T10:00:00Z",    "Status": "Pending"},  
{    "Stock": "NIFTY",    "Price": 150.00,"Date":"2022-03-01",     "Time": "2022-03-01T10:00:00Z",    "Status": "Pending"}];
let Positions=[  {    "Stock": "AAPL", "Date":"2022-03-01",    "Bought Price": 140.00,    "Current Price": 150.00,    "Pnl": 10.00,    "Status": "Open"},  
{    "Stock": "NIFTY",    "Bought Price": 140.00, "Date":"2022-03-01",    "Current Price": 150.00,    "Pnl": 10.00,    "Status": "Open"}];

await multipleInsertDB('Alerts',Alerts);
await multipleInsertDB('Orders',Orders);
await multipleInsertDB('Positions',Positions);

}
// deleteAllDataFromCollection('Alerts');
// deleteAllDataFromCollection('Orders');
// deleteAllDataFromCollection('Positions');
async function deleteAllDataFromCollection(collectionName)
{
    const db = await dbConnect();
    const collection = db.collection(collectionName);
    const x = await collection.deleteMany({});
    console.log(x.deletedCount + " documents deleted");
    return x;
}

  
// This function would be provided by your database module to fetch data
async function GetDataFromDB(collectionName, date) {
  // Implement the data fetching logic here
  // This should return the data in a format that your spreadsheet library can use to update the cells
  return db.fetchCollectionData(collectionName, date);
}

// You would also need a listener that detects when the 'Selected Date' cell changes
// This will depend on how your spreadsheet is set up to notify you of changes
// Here is a conceptual example:

function onSelectedDateChange(newDate) {
  updateSpreadsheetWithDBData(newDate);
}


app.get("/startcron", async (req, res) => {
startcron();
    res.status(200).send({ data: "started" });
});

app.get("/endcron", async (req, res) => {
//CronJob Start
 endcron();
    res.status(200).send({ data: "stopped" });
});

app.get("/", (req, res) => {
  res.send("Welcome to the API!v2");
});

app.post("/samcoTestPlaceOrder", async (req, res) => {
  try {
    console.log(req.body);
    const data = {
      body: req.body,
      headers: req.headers,
      query: req.query,
      // add any other properties you need here
    };
    
    const reqID = await upsertDBlog('WebhookCall', {"reqst": data} , {"uid":randomUUID()});    
  } catch (error) {
    console.error(error);    
    res.status(500).send({ error: 'Failed to upsert the webhook call' });
  }

  const order = {
                  symbolName: req.data.symbol,
                  exchange: req.data.exchange,
                  transactionType: tradeType,
                  orderType: "SL",//"MKT",
                  quantity: quantity.toString(),
                  disclosedQuantity: "",
                  orderValidity: "DAY",
                  productType: "MIS",
                  price:price,
                  priceType:"LTP",
                  triggerPrice:slPrice,
                  afterMarketOrderFlag: "NO"
              };

  res.status(200).send({ data: 'success' });
});


app.get('/get/:id', async (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters
  const docRef = doc(db, 'users', id); // Use the id to get the document reference
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    res.status(404).send('No such document!');
  } else {
    res.send(docSnap.data());
  }
});
async function testcall(req)
{
    
    url='http://localhost:3000/'
    let response1 = await axios.post(url + 'PlaceOrderChartInk',req);
   // let response = await axios.post(url + 'reverseNegativePositions?stocks=[IRCTC,IRCTC23JUN650CE,IRCTC23JUN650PE]', reqdata);
    
   // let response = await axios.post(url + 'cancelPendingOrders',{});
   // cl(response.data);



    //let response = await axios.get(url + 'chartInkSyncSamcoSymbols');
    //let response1 = await axios.post(url + 'PlaceOrderChartInk?config=ChartinkOption1&isPurchaseOptions=false&tradeType=buy&isPapertrade=true', reqdata);
    //let response1 = await axios.post(url + 'PlaceOrderChartInk?config=ChartinkOption1&isPurchaseOptions=false&tradeType=buy', reqdata);
    //let response = await axios.post(url + 'PlaceOrder?stocks=IRCTC&isPurchaseOptions=false&tradeType=buy', reqdata);
   // console.log(response);
}  

let isPapertrade=true;

app.get("/updateSpreadsheetWithDBData", async (req, res) => {
    await updateSpreadsheetWithDBData();
    res.status(200).send({ data: "updated" });
    });
    
//Done need testing
app.post("/updateTrailingStopLoss", async (req, res) => {
    isPapertrade= chkeq(req.query.isPapertrade,'true');
    // Call an API endpoint to get current positions
    let positionsResponse = await samcoApiCall('getPositions', '');
    let positionDetail = positionsResponse.positionDetails.filter(pos => pos.netQuantity > 0);
  
  if (!positionsResponse.positionDetails || positionDetail.length === 0) {
    return res.status(500).send({ error: 'Failed to retrieve positions or all positions have zero net quantity' });
  }
  
    // Get the list of stocks from the request query, if provided
    let requestedStocks = getStrArray(req.query.stocks);
    // Filter for negative positions, and only for requested stocks if provided
  
    cl(positionDetail.map(pos => pos.markToMarketPrice));
    let positions = positionDetail.filter(position => {
        return  (!requestedStocks || requestedStocks.includes(position.tradingSymbol));
    });
    
       // Prepare a place to collect responses
       let responses = [];
        // Get configuration from database
        let conf=(req.query.config)?req.query.config:'standardConfig';
        const reqConf=await getConfigFromDB(conf); 
    
       // Iterate over the positions
       for (let position of positions) {
          let symConf=findFromDB('TradingData',{symbol:position.tradingSymbol});
          let config=(symConf)? symConf:reqConf;
          cl(config);
          return;
  
           // Check if the PnL is greater than the minimum profit
           if (position.pnl > config.MinProfit) {
   
               // Update the trailing stop loss and minimum profit
               config.TrailingStopLoss = position.pnl - config.TrailingSLstep;
               config.MinProfit = position.pnl + config.TrailingSLstep;
   
               //TODO Save the updated configuration to the database
               let updateResponse = await upsertDBlog('TradingData',{symbol:position.tradingSymbol, position:position,config});
               responses.push(updateResponse);
   
           // Check if the PnL is less than the trailing stop loss
           } else if (position.pnl < config.TrailingStopLoss) {
   
               // Define the order to close the trade
               let order = {
                   symbolName: position.tradingSymbol,
                   exchange: position.exchange,
                   transactionType: position.transactionType === 'BUY' ? 'SELL' : 'BUY',  // Reverse the transaction type
                   orderType: 'MKT',  // Market order to ensure the order is filled
                   quantity: position.netQuantity.toString(),
                   orderValidity: 'DAY',
                   productType: 'MIS',
                   afterMarketOrderFlag: 'NO'
               };
   
               // Call the API to place the order
               let orderResponse = await samcoApiCall('placeOrder', order);
               responses.push(orderResponse);
           }
       }
   
       // Respond with the data
       res.status(200).send({ data: responses });
   });

app.post("/PlaceOrderChartInk", async (req, res) => {
    const db = await dbConnect();
    const orderCollection = db.collection('chartInkCalls');
    const cIId = await orderCollection.insertOne(req.body);

   // const cIId= upsertDBlog('chartInkCalls',req.body);
//     res.status(200).send({ data: responses });
// return;



    let tradeType = chkeq(req.query.tradeType,'sell') ? 'SELL' : 'BUY';
  //  cl([req.query.tradeType, req.query.tradeType && typeof req.query.tradeType === 'string' && req.query.tradeType.toLowerCase() === 'sell']);    
    const stocks = req.body.stocks.split(",");
    let conf=(req.query.config)?req.query.config:'Chartink';
    const cnf=await getConfigFromDB(conf);
    const triggerPrices = req.body.trigger_prices.split(",");
    let limitResponse = await samcoApiCall('getLimits','');
    let lmt=limitResponse.equityLimit.grossAvailableMargin;
   // console.log(lmt,stocks,triggerPrices);
    let responses = [];
    for (let i = 0; i < 1; i++) {
            // Check if the 'isPurchaseOptions' query parameter is set to 'true'
            if(chkeq(req.query.isPurchaseOptions , 'true')){
                let optionsData = await samcoApiCall('optionChain',`?exchange=NFO&searchSymbolName=${stocks[i]}`);
               // cl(optionsData);
                let maxVolume = 0, maxVolumeTradingSymbol = '',optionType='',CEsymbol='',PEsymbol='';
                for (let detail of optionsData.optionChainDetails) {
                    let volume = parseInt(detail.volume, 10);    
                    if (volume > maxVolume) {
                        maxVolume = volume;
                        maxVolumeTradingSymbol = detail.tradingSymbol;
                        optionType=detail.optionType;
                    }
                }
                // Override the symbol name with the symbol of the option that has the maximum volume
                if(optionType=='CE')
                { 
                    CEsymbol= maxVolumeTradingSymbol; 
                    PEsymbol= maxVolumeTradingSymbol.replace('CE', 'PE');//TODO only in end change                
                } else 
                {  
                    PEsymbol= maxVolumeTradingSymbol; 
                    CEsymbol= maxVolumeTradingSymbol.replace('PE', 'CE');//TODO only in end change                
                }  
                let optns = optionsData.optionChainDetails.filter(dt => dt.tradingSymbol == CEsymbol || dt.tradingSymbol == PEsymbol);
                
                stocks[i] = (tradeType=='SELL')? PEsymbol:CEsymbol ;
                tradeType='BUY'
            }

            cl(stocks[i]);
        const stock = await getSymbolDetail(stocks[i]);
        const exchange=(stock.exchange == 'BSE')? 'NSE':stock.exchange;
     //   console.log(exchange);
        let priceResponse = await samcoApiCall('getQuote',`?exchange=${exchange}&symbolName=${stocks[i]}`);
       // cl(priceResponse);
        let price = priceResponse.lastTradedPrice; 
        const lotSize=stock.lotSize;
        let quantity=0;
        if(cnf.isAsPerBudget) quantity= Math.floor(Math.floor(lmt* cnf.budgetPercent / cnf.stocksPurchaseCount)/price);
        if(cnf.isOptionLotCount) quantity = lotSize * cnf.optionLotCount;
        if(cnf.isStockCount) quantity=cnf.stocksPurchaseCount;
        if(cnf.isOptionAsPerBudget) quantity=Math.floor(quantity / lotSize) * lotSize;
        cl([stocks[i],exchange,lotSize, tradeType,lmt,quantity]);        
        if(quantity==0 || quantity*price>lmt) responses.push({error: 'quantity is 0 or more than budget'}); 
        else {
            let slPrice=(req.query.SLper) ? price*(100-req.query.SLper)/100: price*.99;
            let tgtPrice=(req.query.TGTper) ? price*(100+req.query.TGTper)/100: price*1.006;
            const order = {
                symbolName: stocks[i],
                exchange: exchange,
                transactionType: tradeType,
                orderType: "SL",//"MKT",
                quantity: quantity.toString(),
                disclosedQuantity: "",
                orderValidity: "DAY",
                productType: "MIS",
                price:parseFloat(price).toFixed(1),
                priceType:"LTP",
                triggerPrice:parseFloat(slPrice).toFixed(1),
                afterMarketOrderFlag: "NO"
            };
            const tgtOrder = {
                symbolName: stocks[i],
                exchange: exchange,
                transactionType: (tradeType=="BUY")?"SELL":"BUY",
                orderType: "L",//"MKT",
                quantity: quantity.toString(),
                disclosedQuantity: "",
                orderValidity: "DAY",
                productType: "MIS",
                price:parseFloat(tgtPrice).toFixed(1),
                priceType:"LTP",
                afterMarketOrderFlag: "NO"
            };
           
   
            const response = await samcoApiCall('placeOrder', order);
            const response2 = await samcoApiCall('placeOrder', tgtOrder);
            cl(response);
            cl(response2);
        let data={lotSize:lotSize,SL:cnf.SL,MinProfit:cnf.MinProfit,TrailingSL: cnf.TrailingSL,Budget:lmt,Quantity:quantity,CIID:cIId,req:order,tgtOrder:tgtOrder};
        upsertDBlog('TradingData',data);
            responses.push(response);
        }
    }
    res.status(200).send({ data: responses });

});
//Done and Tested
app.post("/PlaceOrder", async (req, res) => {
    const reqID = await upsertDBlog('WebhookCall', req.query);
    let tradeType = chkeq(req.query.tradeType,'sell') ? 'SELL' : 'BUY';
  //  cl([req.query.tradeType, req.query.tradeType && typeof req.query.tradeType === 'string' && req.query.tradeType.toLowerCase() === 'sell']);    
  let stocks = [];

  // Check if stocks parameter includes brackets, indicating it's an array
    stocks= getStrArray(req.query.stocks);
  
    let conf=(req.query.config)?req.query.config:'standardConfig';
    const cnf=await getConfigFromDB(conf);
    let limitResponse = await samcoApiCall('getLimits','');
    let lmt=limitResponse.equityLimit.grossAvailableMargin;
   // console.log(lmt,stocks,triggerPrices);
    let responses = [];
    for (let i = 0; i < 1; i++) {
            // Check if the 'isPurchaseOptions' query parameter is set to 'true'
            if(chkeq(req.query.isPurchaseOptions , 'true')){
                let optionsData = await samcoApiCall('optionChain',`?exchange=NFO&searchSymbolName=${stocks[i]}`);
               // cl(optionsData);
                let maxVolume = 0, maxVolumeTradingSymbol = '',optionType='',CEsymbol='',PEsymbol='';
                for (let detail of optionsData.optionChainDetails) {
                    let volume = parseInt(detail.volume, 10);    
                    if (volume > maxVolume) {
                        maxVolume = volume;
                        maxVolumeTradingSymbol = detail.tradingSymbol;
                        optionType=detail.optionType;
                    }
                }
                // Override the symbol name with the symbol of the option that has the maximum volume
                if(optionType=='CE') 
                { 
                    CEsymbol= maxVolumeTradingSymbol; 
                    PEsymbol= maxVolumeTradingSymbol.replace('CE', 'PE');//TODO only in end change                
                } else 
                {  
                    PEsymbol= maxVolumeTradingSymbol; 
                    CEsymbol= maxVolumeTradingSymbol.replace('PE', 'CE');//TODO only in end change                
                }  
                let optns = optionsData.optionChainDetails.filter(dt => dt.tradingSymbol == CEsymbol || dt.tradingSymbol == PEsymbol);
                
                stocks[i] = (tradeType=='SELL')? PEsymbol:CEsymbol ;
                tradeType='BUY'
            }

            cl(stocks[i]);
        const stock = await getSymbolDetail(stocks[i]);
        const exchange=stock.exchange;
     //   console.log(exchange);
        let priceResponse = await samcoApiCall('getQuote',`?exchange=${exchange}&symbolName=${stocks[i]}`);
       // cl(priceResponse);
        let price = priceResponse.closeValue; // You should get the price from the priceResponse
        const lotSize=stock.lotSize;
        const stocksPurchaseNo=cnf.stocksPurchaseNo //TODO move to config
        let quantity=0;
        if(cnf.isAsPerBudget) quantity= Math.floor(Math.floor(lmt* cnf.budgetPercent / cnf.stocksPurchaseCount)/price);
        if(cnf.isOptionLotCount) quantity = lotSize * cnf.optionLotCount;
        if(cnf.isStockCount) quantity=cnf.stocksPurchaseCount;
        if(cnf.isOptionAsPerBudget) quantity=Math.floor(quantity / lotSize) * lotSize;
  
        cl([stocks[i],exchange,lotSize, tradeType,lmt,quantity]);        
        if(quantity==0 || quantity*price>lmt) responses.push({error: 'quantity is 0 or more than budget'}); 
        else {
            let slPrice=(req.query.SLper) ? price*(100-req.query.SLper)/100: price*.99;
            let tgtPrice=(req.query.TGTper) ? price*(100+req.query.TGTper)/100: price*1.01;    
            const order = {
                symbolName: stocks[i],
                exchange: exchange,
                transactionType: tradeType,
                orderType: "SL",//"MKT",
                quantity: quantity.toString(),
                disclosedQuantity: "",
                orderValidity: "DAY",
                productType: "MIS",
                price:price,
                priceType:"LTP",
                triggerPrice:slPrice,
                afterMarketOrderFlag: "NO"
            };
            const tgtOrder = {
                symbolName: stocks[i],
                exchange: exchange,
                transactionType: tradeType,
                orderType: "L",//"MKT",
                quantity: quantity.toString(),
                disclosedQuantity: "",
                orderValidity: "DAY",
                productType: "MIS",
                price:tgtPrice,
                priceType:"LTP",
                afterMarketOrderFlag: "NO"
            };
            const response = await samcoApiCall('placeOrder', order);
            const response2 = await samcoApiCall('placeOrder', tgtOrder);
            cl(response);
            cl(response2);
        let data={lotSize:lotSize,SL:cnf.SL,MinProfit:cnf.MinProfit,TrailingSL: cnf.TrailingSL,Budget:lmt,Quantity:quantity,reqID:reqID,req:order};
        cl(data);
        upsertDBlog('TradingData',data);
            responses.push(response);
        }
    }
    res.status(200).send({ data: responses });

});
//Done and tested
app.post("/cancelPendingOrders", async (req, res) => {

    // Call an API endpoint to get current orders
    let activestatus=['After Market Order Req Received','Pending Order'];
    let orders = await samcoApiCall('orderBook', '');
    let responses=[];
    let orderbook=(orders && orders.orderBookDetails)?orders.orderBookDetails:[];
    let pendingSLOrders = orderbook.filter(o => {
        return (activestatus.includes(o.status) && o.orderType=='SL');
    });
    
    //cl(activeOrders); return;
    for (let order of activeOrders)
    {
        let tgtOrders = orderbook.filter(o => {
            return (o.tradingSymbol==order.tradingSymbol && o.orderType=='L' &&
             activestatus.includes(o.status))
        });
        let response = await samcoApiCall('cancelOrder', `?orderNumber=${order.orderNumber}`);
        for (let tgtOrder of tgtOrders)
        {
            let response = await samcoApiCall('cancelOrder', `?orderNumber=${tgtOrder.orderNumber}`);
            responses.push(response);
        }
        if(tgtOrders.count==0)
        {
            let pos=samcoApiCall('getPositions','');
            let Lorder = pos.positionDetails.filter(pos => pos.netQuantity > 0 && pos.orderType=='L' 
            && pos.tradingSymbol==order.tradingSymbol);
            let slOrder = pos.positionDetails.filter(pos => pos.netQuantity > 0 && pos.orderType=='SL' 
            && pos.tradingSymbol==order.tradingSymbol);
            if(Lorder.count==1 && slOrder.count==0)
            {
                const order = {
                    symbolName: Lorder[0].tradingSymbol,
                    exchange: Lorder.exchange,
                    transactionType: 'SELL',
                    orderType: "MKT",//"MKT",
                    quantity: pos.netQuantity.toString(),
                    disclosedQuantity: "",
                    orderValidity: "DAY",
                    productType: "MIS",
                    afterMarketOrderFlag: "NO"
                };
                let r=samcoApiCall('placeOrder',order);
            }
            if(Lorder.count>1 || slOrder.count>0){}  //TODO

if (!positionsResponse.positionDetails || positionDetail.length === 0) {
  return res.status(500).send({ error: 'Failed to retrieve positions or all positions have zero net quantity' });
}

        }
        responses.push(response);
    }

    // Respond with the data from placing the orders
    res.status(200).send({ data: responses });
});
//Done and tested
app.post("/reverseNegativePositions", async (req, res) => {

    // Call an API endpoint to get current positions
    let positionsResponse = await samcoApiCall('getPositions', '');
    let positionDetail = positionsResponse.positionDetails.filter(pos => pos.netQuantity > 0);

if (!positionsResponse.positionDetails || positionDetail.length === 0) {
    return res.status(500).send({ error: 'Failed to retrieve positions or all positions have zero net quantity' });
}

    // Get the list of stocks from the request query, if provided
    let requestedStocks = getStrArray(req.query.stocks);
    // Filter for negative positions, and only for requested stocks if provided

    cl(positionDetail.map(pos => pos.markToMarketPrice));
    let negativePositions = positionDetail.filter(position => {
        let price = Number(position.markToMarketPrice.replace(/,/g, ''));
        return (price < 0 && (!requestedStocks || requestedStocks.includes(position.tradingSymbol)));
    });
    
    // Prepare a place to collect responses from reversing positions
    let responses = [];
    // Iterate over the negative positions
    for (let position of negativePositions) {
        // Define the order, based on the position
        let order = {
            symbolName: position.tradingSymbol,
            exchange: position.exchange,
            transactionType: position.transactionType === 'BUY' ? 'SELL' : 'BUY',  // Reverse the transaction type
            orderType: 'MKT',  // Market order to ensure the order is filled
            quantity: position.netQuantity.toString(),
            orderValidity: 'DAY',
            productType: 'MIS',
            afterMarketOrderFlag: 'NO'
        };

        // If the exchange is NSE or BSE, double the quantity
        if (position.exchange === 'NSE' || position.exchange === 'BSE') {
            order.quantity = (2 * parseInt(order.quantity)).toString();
        }

        //Call the API to place the order
        let orderResponse = await samcoApiCall('placeOrder', order);
        cl(orderResponse);
        responses.push(orderResponse);

        // If the exchange is NFO and the symbol ends with ...CE or ...PE, reverse the trade
        if (position.exchange === 'NFO' && (position.tradingSymbol.endsWith('CE') || position.tradingSymbol.endsWith('PE'))) {
            // Change ...CE to ...PE or vice versa
            let newSymbolName = position.tradingSymbol.endsWith('CE') ? position.tradingSymbol.replace('CE', 'PE') : position.tradingSymbol.replace('PE', 'CE');

            // Create a new order to buy the opposite option
            let newOrder = {
                ...order,
                symbolName: newSymbolName,
                transactionType: 'BUY'
            };

            // Call the API to place the new order
            let newOrderResponse = await samcoApiCall('placeOrder', newOrder);
            cl(newOrderResponse);
            responses.push(newOrderResponse);
        }
    }

    // Respond with the data from placing the orders
    res.status(200).send({ data: responses });
});
//closeTradesIfProfitOrLoss(10,-20);
/**
 * Closes trades if the total profit is greater than a specified maximum profit or the loss is less than a specified maximum loss.
 * @param {Array} positions - The current positions.
 * @param {number} maxProfit - The maximum profit threshold.
 * @param {number} maxLoss - The maximum loss threshold.
 * @returns {Promise<void>} - A promise that resolves when all trades are closed.
 */

async function getSamcoTotalProfitLoss(maxPercentProfit,maxPercentLoss) {
    let positionsResponse = await samcoApiCall('getPositions', '');
    let positionDetail = positionsResponse.positionDetails;
    let totalNetPositionValue = 0;
    for (let detail of positionDetail) {
        totalNetPositionValue += parseFloat(detail.netPositionValue);
    }
    // Calculate the percentage of the total net position value
    let maxProfit = (totalNetPositionValue * maxPercentProfit) / 100;
    let maxLoss = (totalNetPositionValue * maxPercentLoss) / 100;
    let profitLoss=positionsResponse.positionSummary.dayGainAndLossAmount;
    return {pnl:profitLoss,positionDetail:positionDetail,maxProfit:maxProfit,maxLoss:maxLoss};
}


//Done and tested
app.get("/chartInkSyncSamcoSymbols",async (req,res) => {
    const CSV_URL = 'https://developers.stocknote.com/doc/ScripMaster.csv';
    const CSV_FILE_PATH = './data.csv';
    const MONGODB_URI = 'mongodb+srv://tradinguser:RwrqxxtEQENHHwkt@cluster0.mn5vihj.mongodb.net'; 
    const DB_NAME = 'tradingdb'; 
    const COLLECTION_NAME = 'SamcoSymbolData'; 

    const pipelineAsync = promisify(pipeline);

    try {
        const startTime = new Date();
    
        console.log('Requesting CSV data...');
        const response = await axios({ url: CSV_URL, method: 'GET', responseType: 'stream' });
        console.log('CSV data received.');
    
        console.log('Writing CSV data to file...');
        await pipelineAsync(response.data, fs.createWriteStream(CSV_FILE_PATH));
        console.log('CSV data written to file.');
    
        console.log('Connecting to MongoDB...');
        const db = await dbConnect();
        const collection = db.collection(COLLECTION_NAME);
    
        // console.log('Deleting old data...');
        // await collection.deleteMany({});
        // console.log('Old data deleted.');

        console.log('Dropping old collection...');
        await db.collection(COLLECTION_NAME).drop();
        console.log('Old collection dropped.');
    
        console.log('Reading CSV data from file...');
        let data = [];
        await pipelineAsync(
            fs.createReadStream(CSV_FILE_PATH),
            csv()
                .on('data', (row) => {
                    data.push({
                        insertOne: {
                            document: row
                        }
                    });
                })
        );
    
        console.log(`CSV contains ${data.length} rows.`);
    
        if (data.length > 0) {
            console.log('Inserting new data...');
            await collection.bulkWrite(data);
            console.log('Data inserted successfully.');
        }
    
        await client.close();
    
        const endTime = new Date();
        const timeTaken = endTime - startTime;
        const timeTakenSeconds = Math.floor((timeTaken / 1000) % 60);
        const timeTakenMinutes = Math.floor((timeTaken / (1000 * 60)) % 60);
    
        console.log(`Total time taken: ${timeTakenMinutes} minutes and ${timeTakenSeconds} seconds.`);
    } catch (error) {
        console.error(`Error occurred: ${error}`);
    }
    
});

// async function upsertDBlog(collectionName, req,filter) {
//     try {
//         const db = await dbConnect();
//         const collection = db.collection(collectionName);
//         const query = (filter)?filter:{};
//         if(!req) return 'object is blank';
//         req.time=new Date();
//         const update = { $set: req};
//         const options = { upsert: true };
//         let x = await collection.updateOne(query, update, options);
//         if (x.upsertedCount > 0) return cl(x.upsertedId.toHexString());     
//        else if(x.modifiedCount > 0) return cl(x.modifiedCount +' documents were modified');
//        else   return cl("No documents were upserted.");
       
//       } catch (ex) {
//         console.log(ex);
//         return ex;
//       }
// }
async function getSymbolDetail(samcoSymbol) {
  const db = await dbConnect();
  const collection = db.collection('SamcoSymbolData');
  const data = await collection.findOne({ tradingSymbol: samcoSymbol });
  //console.log(data);
  return data;
}

async function findFromDB(collectionName, filter, returnField) {
    try {
        const db = await dbConnect();
        if (!collectionName) throw new Error('collection not defined');
        filter = filter || {};
        const collection = db.collection(collectionName);
        const document = await collection.findOne(filter);
        if (returnField && document) {
            return _.get(document, returnField);
        } else {
            return document;
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function getConfigFromDB(type) {
  const db = await dbConnect();
  const collection = db.collection('TradingConfig');
  const data = await collection.findOne({type:type});
  //console.log(data);
  return data.config;
}

async function placeSamcoCEPEOrder(CEsymbol,PEsymbol, exchange, quantityInLots){
    let CEorder = {
        symbolName: CEsymbol,
        exchange: exchange,
        transactionType: 'BUY',
        orderType: 'MKT',
        quantity: quantityInLots,
        orderValidity: 'DAY',
        productType: 'MIS',
        afterMarketOrderFlag: 'NO'
    };
    let PEorder = {
        symbolName: PEsymbol,
        exchange: exchange,
        transactionType: 'BUY',
        orderType: 'MKT',
        quantity: quantityInLots,
        orderValidity: 'DAY',
        productType: 'MIS',
        afterMarketOrderFlag: 'NO'
    };
    // Call the API to place the order to close the trade
    let CEresponse = await samcoApiCall('placeOrder', CEorder);
    cl(CEresponse);
    upsertDBlog('TradingData',{order:CEorder,response:CEresponse},{uid:randomUUID()});
    let PEresponse = await samcoApiCall('placeOrder', PEorder);
    upsertDBlog('TradingData',{order:PEorder,response:PEresponse},{uid:randomUUID()});
    cl(PEresponse);
    return {CEresponse:CEresponse,PEresponse:PEresponse};
}

async function placeSamcoMISOrder(position){
    let order = {
        symbolName: position.tradingSymbol,
        exchange: position.exchange,
        transactionType: position.transactionType === 'BUY' ? 'SELL' : 'BUY',
        orderType: 'MKT',
        quantity: position.netQuantity.toString(),
        orderValidity: 'DAY',
        productType: 'MIS',
        afterMarketOrderFlag: 'NO'
    };

    // Call the API to place the order to close the trade
    let response = await samcoApiCall('placeOrder', order);
    cl(response);
    return response;
}

async function samcoApiCall(ApiName, ReqData) {
  console.log('samcoApiCall', ApiName);
//   cl(isPapertrade);
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
    else if (ApiName == 'optionChain')response = await axios.get(url + '/option/' + ApiName + ReqData, { headers: headers });
    else if (ApiName == 'getPositions') response = await axios.get(url + '/position/' + ApiName + '?positionType=DAY' + ReqData, { headers: headers });
    else if (ApiName == 'orderBook') response = await axios.get(url + '/order/' + ApiName + ReqData, { headers: headers });
    else if (ApiName == 'cancelOrder') response = await axios.delete(url + '/order/' + ApiName + ReqData, { headers: headers });
    else if (ApiName == 'eqDervSearch') response = await axios.get(url + '/eqDervSearch/search' + ReqData, { headers: headers });
    https://api.stocknote.com/eqDervSearch/search?searchSymbolName=INFY    
  //  console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(`Error: `);
    throw error;
  }
}
async function samcoApiPapertrade(ApiName,ReqData){
    console.log('samcoApiPapertrade', ApiName);
    
    const db = await dbConnect();
    const orderCollection = db.collection('Orders');
    
    const userLimitsCollection = db.collection('UserLimits');
    const positionsCollection = db.collection('Positions');

    if (ApiName == 'getQuote' || ApiName == 'optionChain') {
        if (sn.snapi.sessionToken == undefined) await loginSamco({});
        const headers = {
        'Content-Type': 'application/json',
        'x-session-token': sn.snapi.sessionToken
        };
        let url = 'https://api.stocknote.com';
        try {
        let response = {};
        if (ApiName == 'getQuote') response = await axios.get(url + '/quote/' + ApiName + ReqData, { headers: headers });
        else if (ApiName == 'optionChain') response = await axios.get(url + '/option/' + ApiName + ReqData, { headers: headers });
        return response.data;
        } catch (error) {
        console.error(`Error: ${error}`);
        throw error;
        }
    }

    else if (ApiName == 'placeOrder' || ApiName == 'getLimits' || ApiName == 'getPositions') {
        try {
        let response = {};

        switch (ApiName) {
            case 'placeOrder':
  {
    const newOrder = ReqData;

    // Validate newOrder fields
    if (!newOrder.price || !newOrder.quantity || !newOrder.userId || !newOrder.symbolName) {
      throw new Error('Missing required order fields');
    }

    // Insert new order
    const orderResult = await orderCollection.insertOne(newOrder);

    const price = newOrder.price;
    const totalValue = newOrder.quantity * price;

    // Check if user has enough funds and update user limit
    const updateResult = await userLimitsCollection.updateOne(
      { userId: newOrder.userId, $expr: { $gte: ["$cashLimit - $usedLimit", totalValue] } }, 
      { $inc: { usedLimit: totalValue } }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error('Not enough funds');
    }

    // Update user position
    const userPosition = await positionsCollection.findOne({ userId: newOrder.userId, symbolName: newOrder.symbolName }) || { quantity: 0, averagePrice: 0 };
    const updatedQuantity = userPosition.quantity + newOrder.quantity;
    const updatedAveragePrice = (userPosition.averagePrice * userPosition.quantity + price * newOrder.quantity) / updatedQuantity;

    await positionsCollection.updateOne(
      { userId: newOrder.userId, symbolName: newOrder.symbolName }, 
      { $set: { quantity: updatedQuantity, averagePrice: updatedAveragePrice } }, 
      { upsert: true }
    );

    response = { orderStatus: 'success', orderId: orderResult.insertedId };
  }
  break;


            case 'getLimits':
              {let userLimits = await userLimitsCollection.findOne({ userId: ReqData.userId });
              response = userLimits || { error: 'User not found' };}
              break;
        
            case 'getPositions':
              let positions = await positionsCollection.find({ userId: ReqData.userId }).toArray();
        
              for (let position of positions) {
                  let currentPriceData = await samcoApiCall('getQuote', {symbolName: position.symbolName});
                  position.currentPrice = currentPriceData.closeValue;
                  position.currentValue = position.currentPrice * position.quantity;
              }
              response=positions;
            // Save the position data to the database
            await positionsCollection.updateOne({userId: ReqData.userId, symbolName: position.symbolName}, {$set: position}, {upsert: true});
            break;
            case  'getAllPositions':
                {
                    let response = {};
                    let positions = await positionsCollection.find({ userId: ReqData.userId }).toArray();
                    response = positions;
                }
                break;

        }

        return response;
        } catch (error) {
        console.error(`Error: ${error}`);
        throw error;
        }
    }
}
function chkeq(val,checkval){
    if(!(val && checkval && typeof val === typeof checkval)) return false;
    if (typeof val === 'string') return val.toLowerCase() === checkval.toLowerCase();
    else return val === checkval;
}
//function cl(r){console.log(r); return r;}
async function loginSamco(req) {
    //console.log("inside login samco");
    const logindata = {
        body: {
            "userId": "DB34326",
            "password": "Pancy@1988",
            "yob": "1989",
        },
    };
    let data = await sn.snapi.userLogin(logindata);
   // console.log(data);
    data = await JSON.parse(data);
    await sn.snapi.setSessionToken(data.sessionToken);
    return data;
}
function getStrArray(val)
{   if(!val) return '';
    if (val.includes('[') && val.includes(']')) {
        let stocksString = val.replace('[', '').replace(']', ''); // removes brackets
        return stocksString.split(","); // splits into array
    } else {
        // It's a single value, not an array
        stocks.push(val);
        return stocks;
    }
}

export default app;