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

function writeGraph(fsGraph, key, data){
  let temp = key + ":" + data.join(',');
  let w_data = temp.slice(0, -1) + "\n";
  console.log(w_data);
  fsGraph.write(w_data, 'UTF8');
}

let crawling = async function(browser){
  let key;
  let queue = [], visited = [];
  let fsGraph
  let map = new HashMap();
  if(fs.existsSync('./candidate') && fs.existsSync('./graph') && fs.existsSync('./visited')){
    queue = fs.readFileSync('./candidate', "utf-8").split(/\n/);
    visited = fs.readFileSync('./visited', "utf-8").split(/\n/);
    queue.pop();
    visited.pop();

    for(idx in visited)
      map.set(visited[idx], "");

    fsGraph = fs.createWriteStream('./graph', {flags: 'a'});
    console.log('Found history file, continue the process');
    console.log('visited: ' + visited);
    console.log('candidate: ' + queue);
  }
  else{
    key = '销售易';
    try{
      res = await scraper.query(browser, key);
      map.set(key, res);
      visited.push(key);
      fsGraph = fs.createWriteStream('./graph');
      writeGraph(fsGraph, key, res);
      queue = res;
    }
    catch(err) {
      console.log(err);
      return;
    }
  }

  if(fs.existsSync('./candidate')){
    console.log('delete cadidate file')
    fs.unlinkSync('./candidate');
  }

  if(fs.existsSync('./visited')){
    console.log('delete visited file')
    fs.unlinkSync('./visited');
  }

  console.log("start crawling")
  while(queue.length > 0 && running){
    await timeout(1000);

    //key = queue.pop(); //DFS
    key = queue.shift(); //BFS

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
          visited.push(key);
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

  console.log('candidate exhausted');
  fsGraph.end();

  if(queue.length > 0){
    let w_data = new Buffer(queue.join('\n'));
    fs.writeFile('./candidate', w_data, {flag: 'a'}, function(err) {
      if(err)
        console.log(err);
      else{
        console.log('candidate file recorded');

        w_data = new Buffer(visited.join('\n'));
        fs.writeFile('./visited', w_data, {flag: 'a'}, function(err) {
          if(err)
            console.log(err);
          else{
            console.log('visited file recorded');
          }
        });

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

