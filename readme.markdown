# MuxDemux

multiplex-demultiplex object streams across _any_ text stream.

``` js
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

```

#API

the API [browser-stream](http://github.com/dominictarr/browser-stream#api)

``` js

var MuxDemux = require('mux-demux')
var client = MuxDemux()
var server = MuxDemux()

client.pipe(server).pipe(client)

server.on('connection', function (stream) {
  // inspect stream.meta to decide what this stream is.
})

client.createWriteStream(meta)
client.createReadStream(meta)
client.createStream(meta)

```
there is actually no distinction between clients and servers.
if both sides are listening `on('connection',...)` then both sides may call `create{Write,Read,}Stream(meta)` and initiate new streams.

### MuxDemux(options)

Creates a MuxDemux stream. Optionally pass in an options hash 

    {
        error: Boolean,
        wrapper: function (stream) {...}
    }

If the error option is set to false then MuxDemux won't emit errors on the streams on unexpected disconnects and instead just end those streams

`wrapper` be used to change the serialization format used by `mux-demux`,
by default, line seperated json is used. see examples [below](#wrapper_examples)
both mux-demux end points must use the same wrapper.

### createReadStream (meta)

open a `ReadableStream` from the other side.
returns a `ReadableStream`.
the other side of connection will emit a writable stream that is connected to this stream.

### createWriteStream (meta)

open a `WritableStream` to the other side.
returns a `WritableStream`, the other side will emit a `ReadableStream` connected to this stream.

### createStream (meta)

open a `Stream` to the other side which is both readable and writable.
returns a `Stream`, the other side will emit a `Stream` connected to this stream.

> note to self, references to a class (`Stream`) should be capitalized, and in backticks.
> references to an instance should be lowercase, and not in backticks unless refuring to
> a specific variable in a code example.

### Wrapper Examples

A stream of plain old js objects.

``` js
new MuxDemux(function (stream) { return stream })
```

A stream of msgpack.

``` js
var es = require('event-stream')
var ms = require('msgpack-stream')

new MuxDemux(function (stream) { 
  return es.pipeline(ms.createDecodeStream(), stream, ms.createEncodeStream()) 
})

```
