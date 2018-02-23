var fs = require('fs');
var HashMap = require('hashmap');
var keypress = require('keypress');

const scraper = require('./scraper.js');
var running = true;

keypress(process.stdin);

process.stdin.on('keypress', function(ch, key) {
  if(key && key.name=='enter'){
    console.log('stop')
    running = false;
    process.stdin.pause();
  }
})

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let crawling = async function(browser){
  let key;
  let queue = [];
  let map = new HashMap();
  if(fs.existsSync('./candidate') && fs.existsSync('./graph')){
    queue = fs.readFileSync('./candidate', "utf-8").split(/\n/);
    queue.pop();
    console.log('found cadidate');
    console.log(queue);
  }
  else{
    key = '销售易';

    try{
      queue = await scraper.query(browser, key);
    }
    catch(err) {
      console.log(err);
      return;
    }

    map.set(key, queue);
  }

  if(fs.existsSync('./candidate')){
    console.log('delete cadidate file')
    fs.unlinkSync('./candidate');
  }

  let fsGraph = fs.createWriteStream('./graph')
  
  while(queue.length > 0 && running){
    await timeout(1000);
    //key = queue.pop();
    key = queue.shift();
    if(!map.has(key)){
      try {
        let res = await scraper.query(browser, key);
        if(res == undefined){
          console.log('failed to retrieve: ' + key);
          queue.unshift(key);
          console.log('need cool down');
          await timeout(100000);
        }
        else{
          let data = key + ":";
          map.set(key, res);
          for (let idx in res){
            if(!map.has(res[idx])){
              queue.push(res[idx]);
            }
            data += res[idx] + ",";
          }
          let trimm = data.slice(0, -1) + "\n";
          console.log(trimm)
          fsGraph.write(trimm, 'UTF8');
        }
      } 
      catch( error) {
        console.log('spider failed at key: ' + key);
        console.log(error);
        queue.unshift(key);
        break;
      }
    }
  }

  fsGraph.end();

  if(queue.length > 0){
    let w_data = new Buffer(queue.join('\n'));
    fs.writeFile('./candidate', w_data, {flag: 'a'}, function(err) {
      if(err)
        console.log(err);
      else{
        console.log('candidate file recorded');
        scraper.stopBrowser(browser);
      }
    })
  }
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

