
var MuxDemux = require('../')
var through  = require('event-stream').through

//make a through stream that is delayed by one tick

require('tape')(function (t) {

function tick () {
  var stream
  return stream = through(function (data) {
    process.nextTick(function () {
      stream.emit('data', data)
    })
  }, function () {
    process.nextTick(function () {
      stream.emit('end', data)
    })
  })
}

var A = MuxDemux()
var B = MuxDemux()

var errored = false

A.pipe(tick()).pipe(B).pipe(tick()).pipe(A)

var a = A.createStream('test')
  .on('error', function (err) {
    errored = true
    console.log('expected error:', err.message)
    t.notEqual(err, null, 'expected an error')
    t.end()
  })

})
