var a = require('assertions')
var es = require('event-stream')
var MuxDemux = require('..') 

var A = new MuxDemux()
var B = new MuxDemux()

var connected, closed, ended, _hi

B.on('connection', function (hi) {
  _hi = hi
  a.equal(hi.meta.name, 'hello')
  connected = true
  hi.once('data', function (data) {
    a.equal(data, 'whatever')
  })
})

A.pipe(es.log('A')).pipe(B)

var hi = A.createStream({name: 'hello'})

hi.write('whatever')
a.ok(connected)

hi.on('end', function () {
  ended = true
})

hi.on('close', function () {
  closed = true
})

hi.end()
_hi.end()
A.end()

a.ok(closed)
a.ok(!ended)
