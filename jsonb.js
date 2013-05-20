var JSONB = require('json-buffer')
var serializer = require('stream-serializer')

var inject = require('./inject')

module.exports = inject(function (stream) {
  return serializer.json(stream, JSONB)
})
