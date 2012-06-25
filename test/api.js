
var MuxDemux = require('..')
var a = require('assertions')

var isFun = a._isFunction

var validMD = a._has({
    createStream: isFun(),
    createWriteStream: isFun(),
    createReadStream: isFun()
  })

var validStream = function (stream) {
  if(stream.writable)
    a.has(stream, {
      write: isFun(),
      end: isFun(),
      destroy: isFun()
    })
  if (stream.readable)
    a.has(stream, {
      destroy: isFun() 
    })
  a.ok(stream.readable || stream.writable, 'stream must be readable or writable') 
}

var md = new MuxDemux()
validMD(md)
validStream(md)


