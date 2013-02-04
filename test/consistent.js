var es = require('event-stream')
//var a  = require('assertions')

module.exports =
function consistent(a) {
  //test = test || a.deepEqual
  var stream = es.through()
  var chunks = 0
  stream.on('data', function () {
    chunks ++
  })
  stream.createSlave = function () {
    var expected = [], count = 0, ended = false
    stream.on('data', function (data) {
      expected.push(data)
    })
    var slave = es.through()
    slave.on('data', function (data) {
      a.ok(expected.length > 0, 'slave stream did not expect write')
      a.equal(ended, false, 'slave expected stream not to have ended') 
      var next = expected.shift()
      count ++
      a.deepEqual(next, data)
    })
    //it's okay to pass data to end(data)
    //but never emit('end', data)
    slave.on('end', function () {
      ended = true
      a.equal(expected.length, 0, 'slave stream expected 0 more writes')
    })
    slave.validate = function (message) {
      a.equal(count, chunks, 'slave must recieve same number of chunks as master')
      a.ok(count)
    }
    return slave
  }
  return stream
}

