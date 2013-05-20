
//test with stream of plain javascript objects
var wrap = require('../msgpack').wrap

require('./')(wrap)
require('./disconnections')(wrap)
