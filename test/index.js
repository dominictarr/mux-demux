var a = require('assertions')
var es = require('event-stream')
var MuxDemux = require('..') 

module.exports = function (wrapper) {

var A = new MuxDemux({wrapper: wrapper})
var B = new MuxDemux({wrapper: wrapper})

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

var hi = A.createStream({name: 'hello'}, {allowHalfOpen: true})

hi.write('whatever')

a.ok(connected)

hi.on('close', function eee () {
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

A.end()

a.ok(closed)
a.ok(!ended)

}

if(!module.parent)
  module.exports()
