var JSONB = require('json-buffer')
var serializer = require('stream-serializer')

var inject = require('./inject')

function wrap (stream) {
  return serializer.json(stream, JSONB)
}

module.exports = inject(wrap)

module.exports.wrap = wrap
