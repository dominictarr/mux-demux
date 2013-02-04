
//var a = require('assertions')
var es = require('event-stream')
var MuxDemux = require('../')
var test = require('tape')

test('test close', function (a) {

  var mx = MuxDemux(), ended = false, callback = false

  mx.on('end', function () {
    ended = true
  })

  mx.close(function () {
    callback = true
  }) //end the mx stream after the sub-streams close.

  var A = mx.createStream()
  var B = mx.createStream()
  var C = mx.createStream()

  a.equal(ended, false)

  A.end()
  B.end()

  a.equal(ended, false)
  a.equal(callback, false)

  C.end()

  process.nextTick(function () {
    a.equal(ended, true)
    a.equal(callback, true)
    a.end()
  })
})
