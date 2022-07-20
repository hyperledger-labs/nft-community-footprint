var express = require('express');
var app = express();
const {MakeMinty} = require('./minty')

//  Enable JSON payloads.
app.use(express.json()) 

// Routing all types - GET/POST/DELETE/PUT
app.all("*",function(req,res,next){
    // CORS
    res.header("Access-Control-Allow-Origin","*");
    // Headers
    res.header("Access-Control-Allow-Headers","*");
    // Methods
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() === 'options')
        res.send(200);  //Options Method - quick response
    else
        next();
});

app.get('/assets/:id', async function (req, res) {
   const options = {
      assetInfo: Boolean(req.query.assetInfo==='true')
   }
   
   const result = await getNFT(req.params.id, options) 
   res.end(JSON.stringify(result))
})

app.post('/transfer', async function (req, res) {   
   const data = await transferNFT(req.body.id, req.body.from, req.body.to)
   res.end(JSON.stringify(data))
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

async function getNFT(tokenId, options) {
    const { assetInfo: fetchAsset } = options
    const minty = await MakeMinty()
    
    return(minty.getNFT(tokenId, {fetchAsset}))
}

async function transferNFT(tokenId, fromAddress, toAddress) {
    const minty = await MakeMinty()

    if (await minty.transferToken(tokenId, fromAddress, toAddress)){
    
      return {
         tokenid:tokenId,
         from:fromAddress,
         to:toAddress
      }

    } else { 
	return { warnning: '*** Fail to transfer' } 
    }
}
