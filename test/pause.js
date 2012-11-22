var MuxDemux = require("..")
var assert = require("assert")

var mdm1 = MuxDemux()
var mdm2 = MuxDemux()
var called = false

mdm2.on("connection", function (stream) {
    assert.equal(stream.meta, "foo")
    called = true
})

mdm1.pause()

mdm1.createStream("foo")

mdm1.pipe(mdm2).pipe(mdm1)

mdm1.resume()

assert.equal(called, true)
