const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

startBrowser = async () => {
  try{
    return browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  }
  catch(err) {
    console.log(err);
    return undefined;
  }
}

stopBrowser = async (browser) => {
  await browser.close();
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

query = async (browser, key) => {
  const page = await browser.newPage();
  await page.setViewport({width: 2000, height: 1080})
  try{
    await page.goto('http://www.baidu.com/s?wd=' + key, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                   });
  }
  catch(err){
    console.log('can not open the page')
    console.log(err);
    return undefined;
  }

  let content = await page.content();
  let $ = cheerio.load(content, { decodeEntities: false });
  let selector = undefined;
  let preSelector = '#con-ar > div:nth-child(1) > div > div > div:nth-child(';
  let result = [];

  if($('#con-ar') == undefined)
    return [];

  for(i=1; i<=5; i+=2){
    let temp = preSelector + i + ')';
    if($(temp) != undefined && $(temp + ' > span').attr('title')=='相关企业'){
      //console.log($(temp).children('a').toArray())
      if($(temp).children('a').length >= 1){
        //onsole.log('clicked')
        await page.click(preSelector + i + ') > a')
        content = await page.content();
        $ = cheerio.load(content, { decodeEntities: false });
      }

      //await page.pdf({
      //  path: key + '.pdf',
      //  format: 'A4',
      //  margin: {
      //        top: "20px",
      //        left: "0px",
      //        right: "0px",
      //        bottom: "20px"
      //  }
      //});

      preSelector += (i+1) + ')';
      selector = preSelector +
                 ' > div.c-row.c-gap-top > div > div:nth-child(2) > a, ' +
                 preSelector +
                 ' > div:nth-child(2) > div.c-row.c-gap-top > div > div:nth-child(2) > a';
      break;
    }
  }

  if($(selector) == undefined){
    console.log('empty for ' + key)
    return [];
  }
  
  $(selector).each((index, el) => {
    let newLabel = $(el).attr('title');
    result.push(newLabel);
  });

  return result;
};

module.exports = {
  startBrowser:startBrowser,
  stopBrowser:stopBrowser,
  query:query,
}
