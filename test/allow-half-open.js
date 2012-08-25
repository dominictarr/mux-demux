var MuxDemux = require('..')
var a = require('assertions')

exports['allowHalfOpen=false by default'] = function (t) {

  var mx = MuxDemux(), emittedEnd = false

  mx.createStream().on('end', function () {
    emittedEnd = true
  })
  .end()

  a.equal(emittedEnd, true)
  t.end()

}

exports['can set to true'] = function (t) {

  var mx = MuxDemux(), emittedEnd = false

  mx.createStream(0, {allowHalfOpen: true}).on('end', function () {
    emittedEnd = true
  })
  .end()

  a.equal(emittedEnd, false)
  t.end()

}

