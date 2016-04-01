var tape = require('tape')
var bitfield = require('bitfield')
var rle = require('./')

tape('encodes and decodes', function (t) {
  var bits = bitfield(1024)
  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, bits.buffer, 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with all bits set', function (t) {
  var bits = bitfield(1024)

  for (var i = 0; i < 1024; i++) bits.set(i, true)

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, bits.buffer, 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with some bits set', function (t) {
  var bits = bitfield(1024)

  bits.set(500, true)
  bits.set(501, true)
  bits.set(502, true)

  bits.set(999, true)
  bits.set(1000, true)
  bits.set(0, true)

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, bits.buffer, 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with random bits set', function (t) {
  var bits = bitfield(8 * 1024)

  for (var i = 0; i < 512; i++) {
    bits.set(Math.floor(Math.random() * 8 * 1024), true)
  }

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, bits.buffer, 'decodes to same buffer')
  t.end()
})

tape('throws on bad input', function (t) {
  t.throws(function () {
    rle.decode(Buffer([100]))
  }, 'invalid delta count')
  t.throws(function () {
    rle.decode(Buffer([10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0]))
  }, 'missing delta')
  t.end()
})
