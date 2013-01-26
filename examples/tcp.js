var MuxDemux = require('..')
var net = require('net')

net.createServer(function (stream) {

  stream.pipe(
    MuxDemux(function (_stream) {
      _stream.on('data', function (date) {
        console.log(date)
      })
    })
  ).pipe(stream)

}).listen(8642, function () {

  var stream = net.connect(8642), mx
  stream.pipe(mx = MuxDemux).pipe(stream)

  var ds = mx.createWriteStream('times')

  setInterval(function () {
    ds.write(new Date().toString())
  }, 1e3)

})



