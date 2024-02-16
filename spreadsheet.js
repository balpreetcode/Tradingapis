import { google } from  "googleapis";
import {Spreadsheets} from './config.js';
//var getConfigSpreadsheet=async function(filename,sheet){return tc(async ()=>{return await getConfigFromSpreadsheet(filename,sheet)})}

export async function getConfigFromSpreadsheet(filename,worksheetName)
  {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    var client=await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId =String( Spreadsheets[filename]);
    await googleSheets.spreadsheets.get({ auth, spreadsheetId,});  
    const getRows = await googleSheets.spreadsheets.values.get({ auth, spreadsheetId, range: `${worksheetName}!A:F`,  });
    //console.log(getRows.data.values);
 var result=   csvJSON(getRows.data.values)
return result;
}

export async function getConfigFromSpreadsheetid(sheetid,worksheetName)
  {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    var client=await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId =sheetid;
    await googleSheets.spreadsheets.get({ auth, spreadsheetId,});  
    const getRows = await googleSheets.spreadsheets.values.get({ auth, spreadsheetId, range: `${worksheetName}!A:F`,  });
    //console.log(getRows.data.values);
 var result=   csvJSON(getRows.data.values)
return result;
}

function csvJSON(csv){
    var result=[];
      for(var i=1;i<csv.length;i++){
          var headers=csv[0];
          var obj = {};
          var currentline=csv[i];
          for(var j=0;j<headers.length;j++){
              obj[headers[j]] = currentline[j];
          }
          result.push(obj);
    
      }
      return result; //JavaScript object
      //return JSON.stringify(result); //JSON
    }

async function updateSpreadsheet(congig,range,values)
{
  const request = {
    spreadsheetId: String( Spreadsheets[filename]),
    range: range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
        "majorDimension": "ROWS",
        "values": values
    },
    auth: oAuth2Client,
};

try {
    const response = (await sheets.spreadsheets.values.append(request)).data;
    console.log(JSON.stringify(response, null, 2));
} catch (err) {
    console.error(err);
}

}


  