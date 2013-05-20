'use strict';

var through = require('through')
  , extend = require('xtend')
  , duplex = require('duplex')

module.exports = function (wrap) {

function MuxDemux (opts, onConnection) {
  if('function' === typeof opts)
    onConnection = opts, opts = null
  opts = opts || {}

  function createID() {
    return (
      Math.random().toString(16).slice(2) +
      Math.random().toString(16).slice(2)
    )
  }

  var streams = {}, streamCount = 0
  var md = duplex()//.resume()

  md.on('_data', function (data) {
    if(!(Array.isArray(data)
      && 'string' === typeof data[0]
      && '__proto__' !== data[0]
      && 'string' === typeof data[1]
      && '__proto__' !== data[1]
    )) return
    var id = data.shift()
    var event = data[0]
    var s = streams[id]
    if(!s) {
      if(event == 'close')
        return
      if(event != 'new')
        return outer.emit('unknown', id)
      md.emit('connection', createStream(id, data[1].meta, data[1].opts))
    }
    else if (event === 'pause')
      s.paused = true
    else if (event === 'resume') {
      var p = s.paused
      s.paused = false
      if(p) s.emit('drain')
    }
    else if (event === 'error') {
      var error = data[1]
      if (typeof error === 'string') {
        s.emit('error', new Error(error))
      } else if (typeof error.message === 'string') {
        var e = new Error(error.message)
        extend(e, error)
        s.emit('error', e)
      } else {
        s.emit('error', error)
      }
    }
    else {
      s.emit.apply(s, data)
    }
  })
  .on('_end', function () {
    destroyAll()
    md._end()
  })

  function destroyAll (_err) {
    md.removeListener('end', destroyAll)
    md.removeListener('error', destroyAll)
    md.removeListener('close', destroyAll)
    var err = _err || new Error ('unexpected disconnection')
    for (var i in streams) {
      var s = streams[i]
      s.destroyed = true
      if (opts.error !== true) {
        s.end()
      } else {
        s.emit('error', err)
        s.destroy()
      }
    }
  }

  //end the stream once sub-streams have ended.
  //(waits for them to close, like on a tcp server)

  function createStream(id, meta, opts) {
    streamCount ++
    var s = through(function (data) {
      if(!this.writable) {
        var err = Error('stream is not writable: ' + id)
        err.stream = this
        return outer.emit("error", err)
      }
      md._data([s.id, 'data', data])
    }, function () {
      md._data([s.id, 'end'])
      if (this.readable && !opts.allowHalfOpen && !this.ended) {
        this.emit("end")
      }
    })
    s.pause = function () {
      md._data([s.id, 'pause'])
    }
    s.resume = function () {
      md._data([s.id, 'resume'])
    }
    s.error = function (message) {
      md._data([s.id, 'error', message])
    }
    s.once('close', function () {
      delete streams[id]
      streamCount --
      md._data([s.id, 'close'])
      if(streamCount === 0)
        md.emit('zero')
    })
    s.writable = opts.writable
    s.readable = opts.readable
    streams[s.id = id] = s
    s.meta = meta
    return s
  }

  var outer = wrap(md, opts)

  if(md !== outer) {
    md.on('connection', function (stream) {
      outer.emit('connection', stream)
    })
  }

  outer.close = function (cb) {
    md.once('zero', function () {
      md._end()
      if(cb) cb()
    })
    return this
  }

  if(onConnection)
    outer.on('connection', onConnection)

  outer.on('connection', function (stream) {
    //if mux-demux recieves a stream but there is nothing to handle it,
    //then return an error to the other side.
    //still trying to think of the best error message.
    if(outer.listeners('connection').length === 1)
      stream.error('remote end lacks connection listener ' 
        + outer.listeners('connection').length)
  })

  var pipe = outer.pipe
  outer.pipe = function (dest, opts) {
    pipe.call(outer, dest, opts)
    md.on('end', destroyAll)
    md.on('close', destroyAll)
    md.on('error', destroyAll)
    return dest
  }

  outer.createStream = function (meta, opts) {
    opts = opts || {}
    if (!opts.writable && !opts.readable)
      opts.readable = opts.writable = true
    var s = createStream(createID(), meta, opts)
    var _opts = {writable: opts.readable, readable: opts.writable}
    md._data([s.id, 'new', {meta: meta, opts: _opts}])
    return s
  }
  outer.createWriteStream = function (meta) {
    return outer.createStream(meta, {writable: true, readable: false})
  }
  outer.createReadStream = function (meta) {
    return outer.createStream(meta, {writable: false, readable: true})
  }

  return outer
}

  return MuxDemux
} //inject

