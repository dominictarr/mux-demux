
var MuxDemux = require('../')

require('tape')('end kills all streams', function (t) {
  var ended = false, closed = false
  var mx1 = MuxDemux()
  var mx2 = MuxDemux()

  var s = mx1.createStream()

  mx1.pipe(mx2).pipe(mx1)

  mx1.on('end', function () {
    ended = true
  })

  mx1.on('close', function () {
    closed = true
  })

  mx1.resume()
  mx1.end()

  process.nextTick(function () {
    t.equal(closed, true)
    t.equal(ended, true)
    t.end()
  })

})
