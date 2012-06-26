var MuxDemux = require('..')
var net = require('net')

var mdm1 = MuxDemux()
var mdm2 = MuxDemux()

mdm2.on('connection', function (stream) {
  stream.on('data', function (date) {
    console.log(date)
  })
})

net.createServer(function (con) {
  con.pipe(mdm2).pipe(con)
}).listen(8642, function () {
  var con = net.connect(8642)
  con.pipe(mdm1).pipe(con)
  var ds = mdm1.createWriteStream('times')

  setInterval(function () {
    ds.write(new Date().toString())
  }, 1e3)
})



