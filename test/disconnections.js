/*
  connect two streams.

  on a disconnect, both streams should emit 'close'
*/

var consistent = require('./consistent')
var MuxDemux = require('../')
var es = require('event-stream')
var test = require('tape')

module.exports = function (wrapper) {

function randomNumberStream (max, count) {
  count = count || 20
  max   = max   || 10
  return es.readable(function (i, cb) {
    this.emit('data', Math.random() * max)
    if(i > count)
    this.emit('end')
    cb()
  })
}

test('disconnections 1', function (a) {

  var master = consistent(a)
  var slave = master.createSlave()

  var client = MuxDemux({error: true, wrapper: wrapper})
  var server = MuxDemux({error: true, wrapper: wrapper})

  client.pipe(server).pipe(client)

  var count = 0, dCount = 1
  server.on('connection', function (stream) {
    a.equal(stream.meta, 'disconnect1')
    stream
      .on('error', function () {
        console.log('<< ERROR')
      })
     .pipe(slave)
      .pipe(es.log('<<'))//.pipe(stream)
      .on('data', function () {
        dCount ++
      })
     .on('end', function () {
        a.equal(count, dCount, 'each stream should see the same items')
        console.log('<< END')
      })
  })
  var rns = randomNumberStream()
  rns
    .on('data', function (data) {
      if(++ count < 12) return
      if(client.writable) {
        client.destroy()
        console.log('DISCONNECT')
      }
      console.log('DATA', data, count)
    })
    .pipe(master)
    .pipe(es.log('>>'))
    .pipe(client.createWriteStream('disconnect1')
      .on('error', function () {rns.destroy(); console.log('>> ERROR')})
      .on('close', function () {
        a.equal(count, dCount, 'each stream should see the same items')
        console.log('>> END')
      //not all the events are emitted, 
      //but since the streams are destroyed,
      //and piping stops then they end up with 
      //the same data through them.
        slave.validate()
        a.end()
      }))

  /*
  THERE are some problems with streams that close.
  or rather, SHOULD close.   
  */ 
 
});

test('simple', function simple (a) {

  var client = MuxDemux({error: true, wrapper: wrapper})
  var server = MuxDemux({error: true, wrapper: wrapper})

  client.pipe(server).pipe(client)

  var r1 = Math.random()
  server.on('connection', function (stream) {
    stream.on('data', function (data) {
      a.equal(data, r1)
      console.log('data')
    })
    stream.on('end', function () {
      console.log('end')
      a.end()
    })
  })

  c = client.createWriteStream()
  c.write(r1)
  c.end()

});

test('disconnect', function disconnect (a) {

  var client = MuxDemux({error: true, wrapper: wrapper})
  var server = MuxDemux({error: true, wrapper: wrapper})

  client.pipe(server).pipe(client)

  var randoms = []
  function rand() {
    var r
    randoms.push(r = Math.random())
    return r
  }
  var clientErr = false, serverErr = false

  var streams = 0, ended = 0
  server.on('connection', function (stream) {
    streams ++
    stream
      .on('data', function (data) {
        var r 
        a.equal(data, r = randoms.shift())
        console.log('data', r)
      })
      .on('error', function () {
        //I'm expecting this
        serverErr = true
        a.equal(streams, 1)
        next()
      })
    var r = Math.random()
    var _ended = false
    stream.on('end', function () {
      a.ok(!_ended, 'end MUST only be emitted once')
      _ended = true
      a.equal(streams, ++ ended)
      console.log('end!!!!')
//      a.end()
    })
  })

  var c = client.createWriteStream('A')
  c.on('error', function (err) {
    //expecting this!
    clientErr = true
    next()
  })

  var n = 1
  function next() {
    if(n--) return
    a.ok(clientErr, 'expected client to emit an error')
    a.ok(serverErr, 'expected server to emit an error')
    console.log('end point emitted errors correctly')
    a.end()
  }

  c.write(rand())
  c.write(rand())
  c.write(rand())
  c.write(rand())
  client.destroy()

  if(c.writable)
    c.write(rand())
  a.throws(function () { c.write(rand()) })

});

}

if(!module.parent)
  module.exports()
