
var a = require('assertions')
var es = require('event-stream')
var MuxDemux = require('..') 

exports.testClose = function (t) {

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

  a.equal(ended, true)

  a.equal(callback, true)

  t.end()

}
