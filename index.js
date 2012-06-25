var es = require('event-stream')

function MuxDemux () {

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
      if(event != 'new')
        return md.emit('error', new Error('does not have stream:' + id))
      md.emit('connection', createStream(id, data[1]))
    } 
    else if (event === 'pause')
      s.paused = true
    else if (event === 'resume') {
      var p = s.paused
      s.paused = false
      if(p) s.emit('drain')
    }
    else {
      s.emit.apply(s, data)
    }
  })


  md.once('close', function () {
    var err = new Error ('unexpected disconnection')
    for (var i in streams) {
      var s = streams[i]
      s.emit('error', err)
      s.destroy()
    } 
  })

  function createStream(id, meta) {
    var s = es.through(function (data) {
      if(!this.writable)
        throw new Error('stream is not writable')
      md.emit('data', [s.id, 'data', data])
    }, function () {
      md.emit('data', [s.id, 'end']) 
    })
    s.pause = function () {
      md.emit('data', [s.id, 'pause'])
    }
    s.resume = function () {
      md.emit('data', [s.id, 'resume'])
    } 
    s.once('close', function () {
      md.emit('data', [s.id, 'close'])
      delete streams[id]
    })
    streams[s.id = id] = s
    s.meta = meta
    return s 
  }

  var outer = es.connect(es.split(), es.parse(), md, es.stringify())
  if(md !== outer)
    md.on('connection', function (stream) {
      outer.emit('connection', stream)
    })

  outer.createStream = function (meta) {
    var s = createStream(createID(), meta)
    md.emit('data', [s.id, 'new', meta]) 
    return s
  }
  outer.createWriteStream = outer.createStream
  outer.createReadStream = outer.createStream

  return outer
}

module.exports = MuxDemux
