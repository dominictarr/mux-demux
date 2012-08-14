var MuxDemux = require('..')
var net = require('net')

net.createServer(function (con) {

  var mdm2 = MuxDemux()
  mdm2.on('connection', function (stream) {
    stream.on('error', function (error) {
      console.log(error)
    })
  })
  con.pipe(mdm2).pipe(con)

}).listen(8642, function () {

  var mdm1 = MuxDemux()
  var con = net.connect(8642)
  con.pipe(mdm1).pipe(con)
  var es = mdm1.createWriteStream('errors')

  setInterval(function () {
    es.error({
        "any error": "message"
    })
  }, 1e3)

})



