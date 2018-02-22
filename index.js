var fs = require('fs');
var HashMap = require('hashmap');
const scraper = require('./scraper.js');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let crawling = async function(browser){
  let key;
  let queue = [];
  let map = new HashMap();
  if(fs.existsSync('./candidate') && fs.existsSync('./graph')){
    queue = fs.readFileSync('./candidate', "utf-8").split(/\n/);
    console.log('found cadidate');
    console.log(queue);
  }
  else{
    key = '销售易';
    queue = await scraper.query(browser, key);
    map.set(key, queue);
  }

  if(fs.existsSync('./candidate')){
    console.log('delete cadidate file')
    fs.unlinkSync('./candidate');
  }

  let fsGraph = fs.createWriteStream('./graph')
  
  while(queue.length > 0){
    await timeout(1000);
    //key = queue.pop();
    key = queue.shift();
    if(!map.has(key)){
      try {
        let res = await scraper.query(browser, key);
        let data = key + ":";
        map.set(key, res);
        for (let idx in res){
          if(!map.has(res[idx])){
            queue.push(res[idx]);
          }
          data += res[idx] + ",";
        }
        fsGraph.write(data, 'UTF8');
      } 
      catch( error) {
        console.log('spider failed');
        break;
      }
    }
  }

  fsGraph.end();
  let w_data = new Buffer(queue.join('/n'));
  fs.writeFile('./candidate', w_data, {flag: 'a'}, function(err) {
    if(err)
      console.log(err);
    else{
      console.log('candidate file recorded');
      scraper.stopBrowser(browser);
    }
  })
};

scraper.startBrowser()
  .catch(e => {
    console.log('can not open the browser');
    return;
  })
  .then(browser => {
    console.log('brwoser created')
    crawling(browser)
  });

