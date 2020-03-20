let x = 1;
console.log('BEFORE CALL: ', x);

setTimeout(() => {
  x = 2;
  console.log('INSIDE CALL: ', x);
}, 1000);

console.log('AFTER CALL', x);

// BEFORE CALL: 1
// INSIDE CALL: 1
// AFTER CALL: 2