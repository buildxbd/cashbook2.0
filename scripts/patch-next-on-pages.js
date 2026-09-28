const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/@cloudflare/next-on-pages/dist/index.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Match the constructor block of Shell
  const shellCtorRegex = /constructor\(overrides\) \{[\s\S]*?this\.process\.stdout\.setEncoding\("utf8"\);[\s\S]*?\}/;

  const shellCtorReplacement = `constructor(overrides) {
    const env2 = {
      ...{ PS1: "", PATH: process.env.PATH },
      ...overrides
    };
    const bashPath = process.platform === 'win32' && require('fs').existsSync('C:\\\\Program Files\\\\Git\\\\bin\\\\bash.exe')
      ? 'C:\\\\Program Files\\\\Git\\\\bin\\\\bash.exe'
      : 'bash';
    this.process = import_child_process.default.spawn(bashPath, ["--noprofile", "--norc"], {
      env: env2,
      detached: true
    });
    this.process.stdout.setEncoding("utf8");
  }`;

  if (shellCtorRegex.test(content)) {
    content = content.replace(shellCtorRegex, shellCtorReplacement);
  }

  // Patch spawn in getVercelBuildChildProcess
  const oldSpawnVercel = 'return (0, import_child_process2.spawn)(spawnCmd.cmd, spawnCmd.cmdArgs);';
  const newSpawnVercel = 'return (0, import_child_process2.spawn)(spawnCmd.cmd, spawnCmd.cmdArgs, { shell: true });';
  if (content.includes(oldSpawnVercel)) {
    content = content.replace(oldSpawnVercel, newSpawnVercel);
  }

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully patched @cloudflare/next-on-pages for Windows environment.');
} else {
  console.log('@cloudflare/next-on-pages/dist/index.js not found.');
}
