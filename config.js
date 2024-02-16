export const Spreadsheets = {
    TradingSetup: 
    {id:'1Z232JpS1wSLgquoDbjHfhRXHed-UlQIX6l6rw4RQ_ZY',
    sections:[
        {name:'Alerts',columns:['Stocks', 'Time'],range:'Sheet1!A5:B20'},
        {name:'Orders',columns:['Stocks','Price','Time','Status'],range:'Sheet1!D5:G20'},
        {name:'Positions',columns:['Stocks','Bought Price','Current Price','Pnl','Status'],range:'Sheet1!I5:M20'}
    ]
    },
    ANYDB:{sheetid:'1uO9mWw9matOgsqPye9w9Uu3Lh5CSwPaocqnWdgggrls',sheets:['gymright','mealright','chatVR']},
    ContentCreation: '1M-8fo4pdGlaPuJT6vH2Kis6XzIDo8iFzgqXHwkqCX_s',
    TYPE3: 'type3'
} 
const env = {
    Prod: '1Z232JpS1wSLgquoDbjHfhRXHed-UlQIX6l6rw4RQ_ZY',
    UAT: 'type2',
    Local: 'type3'
} 