var MuxDemux = require('../')
var test = require('tape')

test('allowHalfOpen=false by default', function (t) {

  var mx = MuxDemux(), emittedEnd = false

  mx.createStream().on('end', function () {
    emittedEnd = true
  })
  .end()

  t.equal(emittedEnd, true)
  t.end()

})

test('can set to true', function (t) {

  var mx = MuxDemux(), emittedEnd = false

  mx.createStream(0, {allowHalfOpen: true}).on('end', function () {
    emittedEnd = true
  })
  .end()

  t.equal(emittedEnd, false)
  t.end()

})
