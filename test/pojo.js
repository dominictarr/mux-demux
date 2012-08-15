
//test with stream of plain javascript objects

function id (stream) { return stream }
require('./')(id)
require('./disconnections')(id)
require('./disconnections2')(id)
