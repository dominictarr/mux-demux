
var inject = require('./inject')
var combine = require('stream-combiner')
var msgpack = require('msgpack-stream')

function wrap (stream) {
  return combine(
    msgpack.createDecodeStream(),
    stream,
    msgpack.createEncodeStream()
  )
}

module.exports = inject(wrap)
module.exports.wrap = wrap

