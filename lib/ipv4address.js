const IPAddress = require('./ipaddress');

const formats = require('./formats');
const utils = require('./utils');
const netutils = require('./netutils');

function format(ip, format) {
  if (format === formats.DotNotation) {
    return ip.map(x => x.toString()).join('.');
  } else if (format === formats.NumericalNotation) {
    return ip.reduce((a, b) => (a * 256) + b, 0).toString();
  } else if (format === formats.HexadecimalNotation) {
    return ip.map(x => utils.lpad(x.toString(16), 2, '0')).join('');
  } else if (format === formats.BinaryNotation) {
    return ip.map(x => utils.lpad(x.toString(2), 8, '0')).join('');
  }

  throw new errors.ArgumentError();
}

function split(ip) {
  if (typeof(ip) !== 'string' && !(ip instanceof String)) {
    throw new errors.ArgumentError();
  }

  ip = ip.toLowerCase();

  let { split, blocks } = netutils.normalize(ip, ['.']);

  if (split === '.') {
    if (blocks.every(x => x.length === 8)) {
      blocks = blocks.map(x => parseInt(x, 2));
    } else if (blocks.every(x => x.length && x.length <= 3)) {
      blocks = blocks.map(x => parseInt(x));
    } else {
      throw new errors.ArgumentError();
    }
  }

  return blocks;
}

function validate(blocks) {
  if (blocks.length != 4) {
    return false;
  }

  if (blocks.some(x => x < 0 || x > 255)) {
    return false;
  }

  return true;
}

module.exports = class extends IPAddress {
  constructor(ip, prefix) {
    super(ip, split, validate);

    if (prefix) {
      if (typeof prefix === 'number' || prefix instanceof Number) {
        this.prefix = prefix;
      } else if (prefix instanceof this.constructor) {
        this.prefix = prefix.as_prefix();
      } else {
        let netmask = new this.constructor(prefix);
        this.prefix = netmask.as_prefix();
      }

      if (this.prefix < 1 || this.prefix > 24) {
        throw new Error();
      }
    }
  }

  get netmask() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let netmask = netutils.netmask(32, 4, this.prefix);
    return new this.constructor(netmask);
  }

  get subnet() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let netmask = netutils.netmask(32, 4, this.prefix);
    let subnet = this.blocks.map((x, i) => x & netmask[i]);
    return new this.constructor(subnet, this.prefix);
  }

  get broadcast() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let netmask = netutils.netmask(32, 4, this.prefix, true);
    let broadcast = this.blocks.map((x, i) => x | netmask[i]);
    return new this.constructor(broadcast, this.prefix);
  }

  get wildcard() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let wildcard = netutils.netmask(32, 4, this.prefix, true);
    return new this.constructor(wildcard, this.prefix);
  }

  get num_hosts() {
    return this.prefix === 32 ? 1 : Math.pow(2, 32 - this.prefix) - 2;
  }

  get min_host() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let mask = netutils.netmask(32, 4, this.prefix);
    let host = this.blocks.map((x, i) => x & mask[i]);
    if (this.prefix !== 32) {
      host[3] += 1;
    }

    return new this.constructor(host, this.prefix);
  }

  get max_host() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    let mask = netutils.netmask(32, 4, this.prefix, true);
    let host = this.blocks.map((x, i) => x | mask[i]);
    if (this.prefix !== 32) {
      host[3] -= 1;
    }

    return new this.constructor(host, this.prefix);
  }

  get is_netmask() {
    let binary = this.binary;
    let splits = binary.split('0').filter(Boolean);
    return splits.length === 1;
  }

  get is_subnet() {
    return this.subnet === this;
  }

  get is_broadcast() {
    return this.broadcast === this;
  }

  get is_multicast() {
    return this.blocks[0] & 0xf0 === 0xe0;
  }

  get normalized() {
    return format(this.blocks, formats.DotNotation);
  }

  get numerical() {
    return format(this.blocks, formats.NumericalNotation);
  }

  get hexadecimal() {
    return format(this.blocks, formats.HexadecimalNotation);
  }

  get binary() {
    return format(this.blocks, formats.BinaryNotation);
  }

  get cidr() {
    if (!this.prefix) {
      throw new Error('prefix not specified');
    }

    return `${this.normalized}/${this.prefix}`
  }

  as_prefix() {
    let binary = this.binary;
    let splits = binary.split('0').filter(Boolean);
    if (splits.length !== 1) {
      throw new Error();
    }

    return splits[0].length;
  }
}
