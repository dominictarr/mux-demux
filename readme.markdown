# MuxDemux

multiplex-demultiplex object streams across _any_ text stream.

[![Build Status](https://travis-ci.org/dominictarr/mux-demux.png)]
  (https://travis-ci.org/dominictarr/mux-demux)

## Stability

Stable: Expect patches, possible features additions.

## Example

``` js
var MuxDemux = require('mux-demux')
var net = require('net')

net.createServer(function (con) {
  con.pipe(MuxDemux(function (stream) {
    stream.on('data', console.log.bind(console))
  })).pipe(con)
}).listen(8642, function () {
  var con = net.connect(8642), mx
  con.pipe(mx = MuxDemux()).pipe(con)

  var ds = mx.createWriteStream('times')

  setInterval(function () {
    ds.write(new Date().toString())
  }, 1e3)
})
```

## Gotchas

take care to create a `MuxDemux` instance per connection,
do not connect many connections to one `MuxDemux'.

### Right

``` js
net.createServer(function (stream) {
  stream.pipe(MuxDemux(function (_stream) { 

  }).pipe(stream)
}).listen(port)
```

### WRONG!
``` js
var mx = MuxDemux()
net.createServer(function (stream) {
  //this will connect many streams to the OUTER MuxDemux Stream!
  stream.pipe(mx).pipe(stream)
}).listen(port)
```

### Errors, and use in PRODUCTION

`mux-demux` parses a `JSON` protocol, and so you must handle any errors
that may result from someone connecting, and sending invalid data.

``` js
net.createServer(function (stream) {
  var mx = MuxDemux()
  stream.pipe(mx).pipe(stream)
  mx.on('error', function () {
    stream.destroy()
  })
  stream.on('error', function () {
    mx.destroy()
  })
}).listen(9999)
```

#API

the API [browser-stream](http://github.com/dominictarr/browser-stream#api)

``` js

var MuxDemux = require('mux-demux')
var a = MuxDemux()
var b = MuxDemux()

a.pipe(b).pipe(a)

b.on('connection', function (stream) {
  // inspect stream.meta to decide what this stream is.
})

a.createWriteStream(meta)
a.createReadStream(meta)
a.createStream(meta)

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
