module.exports.normalize = (address, splits) => {
  if (typeof address !== 'string' && !(address instanceof String)) {
    throw new Error();
  }

  let split = undefined;
  let blocks = [''];

  if (['0x', '0h', 'h'].some(x => address.startsWith(x))) {
    split = null;
    address = address.slice(2);
  }

  for (let c of address) {
    if (splits.indexOf(c) + 1) {
      if (split === undefined || split === c) {
        split = c;
        blocks.push('');
      } else {
        throw new errors.ArgumentError();
      }
    } else if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
      blocks[blocks.length - 1] += c;
    } else {
      throw new errors.ArgumentError();
    }
  }

  return { split, blocks };
}

module.exports.netmask = (length, split, prefix, inverse) => {
  let first = Array(prefix + 1).join(inverse ? 0 : 1);
  let second = Array(length - prefix + 1).join(inverse ? 1 : 0);
  let mask = first + second
  return new RegExp(`.{${length/split}}`, 'g')[Symbol.match](first + second)
    .map(x => parseInt(x, 2));
}
