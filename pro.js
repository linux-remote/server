const {execSync} = require('child_process');
const path = require('path');
execSync(process.argv[0] + ' ' + path.join(__dirname, 'src/index.js'), {
  stdio: 'inherit'
});
