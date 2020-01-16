export const timeout = (ms, fn) => {
  return new Promise((resolve, reject) => {
    const handle = setTimeout(() => {
      reject(Error('timed out'))
    }, ms)

    fn().then((...ret) => {
      clearTimeout(handle)
      resolve(...ret)
    })
  })
}

// Array, shuffled
export const shuffle = arr => {
  const rands = arr.map(() => Math.random())
  return Object.keys(arr)
    .sort((a, b) => rands[a] - rands[b])
    .map(idx => arr[idx])
}
