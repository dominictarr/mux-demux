# MuxDemux

multiplex-demultiplex object streams across _any_ text stream.

``` js

var MuxDemux = require('mux-demux')
var net = require('net')

var mdm1 = new MuxDemux()
var mdm2 = new MuxDemux()

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
  con.pipe(mdm2.getMuxDeMuxStream()).pipe(con)
}).listen(8642, function () {
  var con = net.connect(8642)
  con.pipe(mdm1.getMuxDeMuxStream()).pipe(con)
})

```

#API

the API is identical to [browser-stream](http://github.com/dominictarr/browser-stream)
