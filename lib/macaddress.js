const Address = require('./address');

const formats = require('./formats');
const utils = require('./utils');
const netutils = require('./netutils');

function format(mac, format) {
  let str = mac.map(x => utils.lpad(x.toString(16), 2, '0'));

  if (format === formats.ColonNotation) {
    return str.join(':');
  } else if (format === formats.HyphenNotation) {
    return str.join('-');
  } else if (format === formats.DotNotation) {
    return str.reduce((a, b, i) => a + (i % 2 ? '' : '.') + b);
  } else if (format === formats.HexadecimalNotation) {
    return str.join('');
  }

  throw new errors.ArgumentError();
}

function split(mac) {
  if (typeof(mac) !== 'string' && !(mac instanceof String)) {
    throw new errors.ArgumentError();
  }

  mac = mac.toLowerCase();

  let { split, blocks } = netutils.normalize(mac, [':', '-', '.']);

  if (split === ':' || split === '-') {
    if (blocks.length != 6 || blocks.some(x => x.length != 2)) {
      throw new errors.ArgumentError()
    }
  } else if (split === '.') {
    if (blocks.length != 3 || blocks.some(x => x.length != 4)) {
      throw new errors.ArgumentError()
    }

    blocks = blocks
      .map(x => [x.slice(0, 2), x.slice(2, 4)])
      .reduce((a, b) => a.concat(b));
  } else {
    blocks = (/.{2}/g)[Symbol.match](blocks[0]);
  }

  return blocks.map(x => parseInt(x, 16));
}

function validate(blocks) {
  if (blocks.length != 6) {
    return false;
  }

  if (blocks.some(x => x < 0 || x > 255)) {
    return false;
  }

  return true;
}


module.exports = class extends Address {
  constructor(mac) {
    super(mac, split, validate);
  }

  get oui() {
    return this.blocks.slice(0,3);
  }

  get nic() {
    return this.blocks.slice(3, 6);
  }

  get unicast() {
    return !(this.blocks[0] & 0x01);
  }

  get multicast() {
    return !this.unicast;
  }

  get universal() {
    return !(this.blocks[0] & 0x02);
  }

  get local() {
    return !this.universal;
  }

  format(format) {
    return this.constructor._format(this.blocks, format);
  }

  normalize() {
    return this.constructor._format(this.blocks, '-');
  }

}
