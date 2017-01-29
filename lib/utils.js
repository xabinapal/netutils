module.exports.lpad = (str, length, c) => {
  let plen = length - str.length;
  let pstr;
  if (!plen) {
    pstr = str;
  } else if (plen < 0) {
    pstr = str.slice(Math.abs(plen));
  } else {
    pstr = Array(plen + 1).join(c || ' ') + str;
  }

  return pstr;
}
