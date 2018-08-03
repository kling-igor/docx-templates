module.exports = (string, len = 30) => {
  let curr = len
  let prev = 0
  const output = [];

  while (string[curr]) {
    if (string[curr++] === ' ') {
      output.push(string.substring(prev, curr).trim());
      prev = curr;
      curr += len;
    }
    else {
      let currReverse = curr;
      do {
        if (string.substring(currReverse - 1, currReverse) === ' ') {
          output.push(string.substring(prev, currReverse).trim());
          prev = currReverse;
          curr = currReverse + len;
          break;
        }
        currReverse -= 1
      } while (currReverse > prev)
    }
  }
  output.push(string.substr(prev).trim());
  return output;
}