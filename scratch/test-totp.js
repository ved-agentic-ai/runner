const otplib = require('otplib');

const secret = otplib.generateSecret();
const code = otplib.generateSync({ secret });

console.log('Generated Secret:', secret);
console.log('Generated Code:  ', code);

const isMatch = otplib.verifySync({ secret, token: code });
console.log('Verification:    ', isMatch ? 'PASSED ✅' : 'FAILED ❌');
