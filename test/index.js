var a = require('assertions')
var es = require('event-stream')
var MuxDemux = require('..') 

var A = new MuxDemux()
var B = new MuxDemux()

var connected, closed, ended, _hi

B.on('connection', function (hi) {
  _hi = hi
  console.log('CONNECTION')
  a.equal(hi.meta.name, 'hello')
  connected = true
  hi.once('data', function (data) {
    a.equal(data, 'whatever')
  })
})

A.pipe(B).pipe(A)

var hi = A.createStream({name: 'hello'})

hi.write('whatever')

a.ok(connected)

hi.on('close', function eee () {
  console.log('CLISED!!!')
  closed = true
})

hi.end()
a.equal(hi.writable, false)
a.equal(_hi.readable, false)

_hi.end()
a.equal(_hi.writable, false)
a.equal(hi.readable, false)

hi.on('close', function () { console.log('HI CLOSE') })
_hi.on('close', function () { console.log('_HI CLOSE') })

console.log('BIG END')

A.end()

a.ok(closed)
a.ok(!ended)
