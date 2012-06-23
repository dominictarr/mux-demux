var es = require('event-stream')
var RemoteEventEmitter = require('remote-events')
var _bs = require('browser-stream')

function MuxDemux () {
  var ree = new RemoteEventEmitter()
  var bs = _bs(ree)
  bs.getMuxDemuxStream = function () {
    return es.connect(
      es.split(),
      es.parse(),
      ree.getStream(),
      es.stringify()
    )
  }
  return bs
}

module.exports = MuxDemux
