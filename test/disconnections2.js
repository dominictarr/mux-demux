/*
  connect two streams.

  on a disconnect, both streams should emit 'close'
*/

var a = require('assertions')
var consistent = require('./consistent')
var MuxDemux = require('..')
var es = require('event-stream')

module.exports = function (wrapper) {

function randomNumberStream (max, count) {
  count = count || 20
  max   = max   || 10
  return es.readable(function (i, cb) {
    this.emit('data', Math.random() * max)
    if(i > count)
    this.emit('end')
    cb()
  })
}

;(function disconnect2 () {
console.log('disconnect2')

  var client = MuxDemux({error: true, wrapper: wrapper})
  var server = MuxDemux({error: true, wrapper: wrapper})

  client.pipe(server).pipe(client)

  var randoms = []
  function rand() {
    var r
    randoms.push(r = Math.random())
    return r
  }
  var streams = 0
  server.on('connection', function (s) {
    console.log('CONNECTION!!!')
    s.write(rand())
    s.write(rand())
    s.write(rand())
    s.write(rand())
    console.log('END')    
    try {
    s.end()
    } catch (err) {
      console.error('END THREW')
      throw err
    }
    console.log('ENDED')    
  })

  c = client.createReadStream()
  c.on('data', function (data) {
    var r 
    a.equal(data, r = randoms.shift())
    console.log('data', r)
  })
  .on('end', function () {
    console.log('end')
  })

})();

}

if(!module.parent)
  module.exports()
