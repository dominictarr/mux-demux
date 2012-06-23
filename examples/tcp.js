var MuxDemux = require('..')
var net = require('net')

var mdm1 = MuxDemux()
var mdm2 = MuxDemux()

var ds = mdm1.createWriteStream('times')

mdm2.on('connection', function (stream) {
  stream.on('data', function (date) {
    console.log(date)
  })
})

setInterval(function () {
  ds.write(new Date().toString())
}, 1e3)

net.createServer(function (con) {
  con.pipe(mdm2.getMuxDemuxStream()).pipe(con)
}).listen(8642, function () {
  var con = net.connect(8642)
  con.pipe(mdm1.getMuxDemuxStream()).pipe(con)
})



