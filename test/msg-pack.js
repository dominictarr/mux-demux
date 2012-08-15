
//test with stream of plain javascript objects

var es = require('event-stream')
var ms = require('msgpack-stream')

function wrapper (stream) { 
  return es.pipeline(ms.createDecodeStream(), es.log('<<'), stream, es.log('>>'), ms.createEncodeStream()) 
}
require('./')(wrapper)
require('./disconnections')(wrapper)
