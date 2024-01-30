import express from "express";
const app = express();
const PORT = process.env.PORT || 5001;
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

dotenv.config();
app.use(cors());

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});

const firebaseConfig = {
  apiKey: "AIzaSyBpJ259fUt9afgnFOEabtjoKbEwbFm_gZ8",
  authDomain: "vrchat-2f58c.firebaseapp.com",
  projectId: "vrchat-2f58c",
  storageBucket: "vrchat-2f58c.appspot.com",
  messagingSenderId: "315680730497",
  appId: "1:315680730497:web:acd9cd885946d0bc33cc80",
  measurementId: "G-JFJVFZS1H3"
};
let reqdata={
  "stocks": "BIKAJI,LATENTVIEW,LTIM,SHOPERSTOP,HONAUT,BAJAJELEC",
  "trigger_prices": "414.05,347,5062.3,812.7,42368.2,1271.45",
  "triggered_at": "10:25 am",
  "scan_name": "15 minute Stock Breakouts",
  "scan_url": "15-minute-stock-breakouts",
  "alert_name": "Alert for 15 minute Stock Breakouts",
  "webhook_url": "https://us-central1-techprojects-24daa.cloudfunctions.net/app/PlaceOrderChartInk"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

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

async function upsertDBlog(collectionName, req, filter) {
  const collectionRef = collection(db, collectionName);
  let query = collectionRef;

  // Apply the filter if it exists
  if (filter) {
    for (const [field, operator, value] of filter) {
      query = where(query, field, operator, value);
    }
  }

  const querySnapshot = await getDocs(query);
  const docs = querySnapshot.docs;

  for (const doc of docs) {
    const docRef = doc(db, collectionName, doc.id);
    try {
      await setDoc(docRef, req, { merge: true }); // Merge the new data with the existing document
      const docSnap = await getDoc(docRef);
    
      if (!docSnap.exists()) {
        console.log("No documents were upserted.");
        return "No documents were upserted.";
      } else if (docSnap.data().time === req.time) {
        console.log("1 document was upserted.");
        return "1 document was upserted.";
      } else {
        console.log("1 document was modified.");
        return "1 document was modified.";
      }
    } catch (ex) {
      console.log(ex);
      return ex;
    }
  }
}

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

let optionsData = await samcoApiCall('optionChain',`?exchange=NFO&searchSymbolName=${stocks[i]}`);
let maxVolume = 0, maxVolumeTradingSymbol = '',optionType='',CEsymbol='',PEsymbol='';
for (let detail of optionsData.optionChainDetails) {
    let volume = parseInt(detail.volume, 10);    
    if (volume > maxVolume) {
        maxVolume = volume;
        maxVolumeTradingSymbol = detail.tradingSymbol;
        optionType=detail.optionType;
    }
}
let optns = optionsData.optionChainDetails.filter(dt => dt.tradingSymbol == CEsymbol || dt.tradingSymbol == PEsymbol);
             
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

// Route for 'long'
app.get('/long', (req, res) => {
  res.json({ message: 'This is the long API response.' });
});

// Route for 'short'
app.get('/short', (req, res) => {
  res.json({ message: 'This is the short API response.' });
});

// Route for 'long close'
app.get('/longclose', (req, res) => {
  res.json({ message: 'This is the long close API response.' });
});

// Route for 'short close'
app.get('/shortclose', (req, res) => {
  res.json({ message: 'This is the short close API response.' });
});

export default app;