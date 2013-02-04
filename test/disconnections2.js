/*
  connect two streams.

  on a disconnect, both streams should emit 'close'
*/

//var a = require('assertions')
var consistent = require('./consistent')
var MuxDemux = require('../')
var es = require('event-stream')
var test = require('tape')

module.exports = function (wrapper) {

test('disconnect 2', function (a) {
console.log('disconnect2')

  var client = MuxDemux({error: true, wrapper: wrapper})
  var server = MuxDemux({error: true, wrapper: wrapper})

  client.pipe(server).pipe(client)
//  server.pipe(process.stderr, {end: false})
  var randoms = []
  function rand() {
    var r
    randoms.push(r = Math.random())
    return r
  }
  var streams = 0
  server.on('connection', function (s) {
    console.log('CONNECTION!!!')
    s.write(rand())
    s.write(rand())
    s.write(rand())
    s.write(rand())
    console.log('END')    
    try {
      s.end()
    } catch (err) {
      console.error('END THREW')
      throw err
    }
    console.log('ENDED')    
  })

  c = client.createStream()
  c.on('data', function (data) {
    var r 
    a.equal(data, r = randoms.shift())
    console.log('data>>', r)
  })
  .on('end', function () {
    console.log('end>>')
    a.end()
  })

//  c.pipe(process.stderr, {end: false})

});

}

if(!module.parent)
  module.exports()
