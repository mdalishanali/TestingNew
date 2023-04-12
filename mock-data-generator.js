const readline = require("readline");
const casual = require("casual");
const database = require("./server/lib/db");
const dataGenConfig = require('./mock-data-gen-config.json')

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  error: process.stderr,
});

const ask = (message, default_value = null) =>
  new Promise((resolve) => {
    reader.question(message, (response) => {
      return resolve(response.length >= 1 ? response : default_value);
    });
  });

const addMockData = async () => {
    if(dataGenConfig.feilds && dataGenConfig.feilds.length > 0){
        dataGenConfig.feilds.forEach(async (feild) => {
            const curSchema = database[feild.schema].schema.obj
            const curMockObjects = {}
            Object.keys(curSchema).forEach(key => {
                if(Boolean(curSchema[key].mockName)){
                    curMockObjects[key] = curSchema[key]
                }
            })
        
            const curMockObjectsKeys = Object.keys(curMockObjects)
            if(curMockObjectsKeys.length > 0){
                const data = []
                for(let i = 0; i < feild.count; i++){
                    curDataObj = {}
                    curMockObjectsKeys.forEach(key => {
                        curDataObj[key] = casual[curMockObjects[key].mockName]
                    })
                    const staticFeilds = Object.keys(feild.staticFeilds)
                    if(staticFeilds.length > 0){
                        staticFeilds.forEach(staticFeild => {
                            curDataObj[staticFeild] = feild.staticFeilds[staticFeild]
                        })
                    }
                    data.push(curDataObj)
                }
                const insetedData = await database[feild.schema].insertMany(data)
                console.info('\x1b[32m%s\x1b[0m',`Inserted for ${feild.schema}!`)
            }else{
                console.info('\x1b[31m%s\x1b[0m',`No mockName present for ${feild.schema}!`)
            }
        })
    }else{
        throw new Error("Check mock-data-gen-config.json file!");
    }
};

(async () => {
  await database;
  if (database) {
    setTimeout(async () => {
        console.info()
        const databaseUri = process.env.DB_PATH
        console.info('\x1b[36m%s\x1b[0m', "DB URI:", databaseUri)
      let correctDB = await ask(
        `Are you sure that you are connected to correct DB? \x1b[36m(y/n)\x1b[0m: `
      );
      if (correctDB && correctDB === "y") {
        addMockData();
      } else {
        throw new Error("Try Again!");
      }
    }, 2000);
  }
})();

// config example
// {
//     "feilds": [
//         {
//             "schema": "Company",    //schema name
//             "count": 15,            //no of docs to be inserted
//             "staticFeilds": {       
//                 "userId": "61d5295b00cf1c2a000f46bf"     //static feilds with key and value
//             }
//         },
//     ]
// }
