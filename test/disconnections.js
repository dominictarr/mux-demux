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
  client.resume()
  server.resume()
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


}

if(!module.parent)
  module.exports()
