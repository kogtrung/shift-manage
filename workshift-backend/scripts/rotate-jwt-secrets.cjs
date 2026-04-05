const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
const a = crypto.randomBytes(48).toString('base64url');
const b = crypto.randomBytes(48).toString('base64url');

let text = '';
if (fs.existsSync(envPath)) {
  text = fs.readFileSync(envPath, 'utf8');
}

const lines = text.split(/\r?\n/);
let sawSecret = false;
let sawRefresh = false;
const out = lines.map((line) => {
  if (/^JWT_SECRET=/.test(line)) {
    sawSecret = true;
    return `JWT_SECRET=${a}`;
  }
  if (/^JWT_REFRESH_SECRET=/.test(line)) {
    sawRefresh = true;
    return `JWT_REFRESH_SECRET=${b}`;
  }
  return line;
});

if (!sawSecret) {
  out.push(`JWT_SECRET=${a}`);
}
if (!sawRefresh) {
  out.push(`JWT_REFRESH_SECRET=${b}`);
}

const content = out.join('\n').replace(/\n+$/, '') + '\n';
fs.writeFileSync(envPath, content, 'utf8');
console.log('Đã đổi JWT_SECRET và JWT_REFRESH_SECRET. Đăng nhập lại (token cũ không còn hiệu lực).');
