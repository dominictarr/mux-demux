
# MuxDemux

multiplex-demultiplex object streams across _any_ text stream.

``` js
var MuxDemux = require('..')
var net = require('net')

var mdm1 = MuxDemux()

var mdm2 = 
  MuxDemux(function (stream) {
    stream.on('data', console.log.bind(console))
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

### MuxDemux(options, onConnection)

Creates a MuxDemux stream. Optionally pass in an options hash 

    {
        error: Boolean,
        wrapper: function (stream) {...}
    }

If the error option is set to true  then MuxDemux will emit errors on the 
streams on unexpected disconnects. othewise, it will just emit 'end' on those streams.

`wrapper` be used to change the serialization format used by `mux-demux`,
by default, line seperated json is used. see examples [below](#wrapper_examples)
both mux-demux end points must use the same wrapper.

`options` is optional. `MuxDemux(onConnection)` is a shortcut 
for `MuxDemux().on('connection', onConnection)`

### createReadStream (meta)

open a `ReadableStream` from the other side.
returns a `ReadableStream`.
the other side of connection will emit a writable stream that is connected to this stream.

### createWriteStream (meta)

open a `WritableStream` to the other side.
returns a `WritableStream`, the other side will emit a `ReadableStream` connected to this stream.

### createStream (meta, opts)

open a `Stream` to the other side which is both readable and writable.
returns a `Stream`, the other side will emit a `Stream` connected to this stream.

opts may be `{allowHalfOpen: true}`, if this is not set, the stream will emit
`'end'` when `end()` is called. this may cause the stream to loose some data 
from the other end. If `allowHalfOpen` is `true` then the remote end must call `end()`.

> note to self, references to a class (`Stream`) should be capitalized, and in backticks.
> references to an instance should be lowercase, and not in backticks unless refuring to
> a specific variable in a code example.

### close(cb)

asks mux-demux to emit end once all the sub-streams have closed.
this will wait untill they have ended, closed, or errored, just like 
[`net.Server#close`](http://nodejs.org/api/net.html#net_server_close_cb).

Takes an optional callback, and emits the 'end' event. 

### Wrapper Examples

A stream of plain old js objects.

``` js
new MuxDemux({wrapper: function (stream) { return stream } })
```

A stream of msgpack.

``` js
var es = require('event-stream')
var ms = require('msgpack-stream')

new MuxDemux({wrapper: function (stream) { 
  return es.pipeline(ms.createDecodeStream(), stream, ms.createEncodeStream()) 
}})

```

### MuxDemuxStream#error

there is one addition to the stream interface. call `stream.error(err)`
will send an error that will be emitted at the other side of the stream.
this is useful for sending 404 like messages to clients, etc.
