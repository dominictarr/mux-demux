var es = require('event-stream')
  , extend = require('xtend')

function MuxDemux (opts) {
  if('function' === typeof opts)
    opts = {wrapper: opts}

  function createID() {
    return (
      Math.random().toString(16).slice(2) +
      Math.random().toString(16).slice(2)
    )
  }

  var streams = {}, streamCount = 0
  var md = es.through(function (data) {
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

  function destroyAll (_err) {
    md.removeListener('end', destroyAll)
    md.removeListener('error', destroyAll)
    md.removeListener('close', destroyAll)
    var err = _err || new Error ('unexpected disconnection')
    for (var i in streams) {
      var s = streams[i]
      s.destroyed = true
      if (opts && opts.error === false) {
        s.end()
      } else {
        s.emit('error', err)
        s.destroy()
      }
    }
  }


  //the problem here, is that this is registering the first
  //event listener.
  //and so in this test, the close message is 
  //getting to the other side first
 md.pause = function () {}
  md.resume = function () {}

  function createStream(id, meta, opts) {
    var s = es.through(function (data) {
      if(!this.writable)
        return outer.emit("error", Error('stream is not writable: ' + id))
      md.emit('data', [s.id, 'data', data])
    }, function () {
      md.emit('data', [s.id, 'end'])
      if (this.readable && !opts.allowHalfOpen && !this.ended) {
        this.emit("end")
      }
    })
    s.pause = function () {
      md.emit('data', [s.id, 'pause'])
    }
    s.resume = function () {
      md.emit('data', [s.id, 'resume'])
    }
    s.error = function (message) {
      md.emit('data', [s.id, 'error', message])
    }
    s.once('close', function () {
      md.emit('data', [s.id, 'close'])
      delete streams[id]
    })
    s.writable = opts.writable
    s.readable = opts.readable
    streams[s.id = id] = s
    s.meta = meta
    return s
  }

  var outer = (
    opts && opts.wrapper ? opts.wrapper(md) :
    es.pipeline(es.split(), es.parse(), md, es.stringify())
  )

  if(md !== outer)
    md.on('connection', function (stream) {
      outer.emit('connection', stream)
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
    md.emit('data', [s.id, 'new', {meta: meta, opts: _opts}])
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

module.exports = MuxDemux
