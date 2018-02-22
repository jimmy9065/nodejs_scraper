var fs = require('fs');
var HashMap = require('hashmap');
const scraper = require('./scraper.js');
var queue = [];
var map = new HashMap();

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let crawling = async function(browser){
  let key = '销售易';
  //let key = '微盟';
  let res = await scraper.query(browser, key);
  map.set(key, res);
  queue = res;
  
  while(queue.length > 0){
    await timeout(1000);
    //key = queue.pop();
    key = queue.shift();
    if(!map.has(key)){
      let res = await scraper.query(browser, key);
      map.set(key, res);
      for (let idx in res){
        if(!map.has(res[idx])){
          queue.push(res[idx]);
        }
      }
    }
  }

  scraper.stopBrowser(browser);
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

