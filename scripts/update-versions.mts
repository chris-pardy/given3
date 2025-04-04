import { argv } from 'node:process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const newVersion = argv[2];

if (!newVersion) {
  console.error('No new version provided');
  process.exit(1);
}

const updateVersion = (version: string) => {
    const [major, minor, patch] = version.split('.');
    if (newVersion === 'patch') {
        return `${major}.${minor}.${Number(patch) + 1}`;
    }
    if (newVersion === 'minor') {
        return `${major}.${Number(minor) + 1}.0`;
    }
    if (newVersion === 'major') {
        return `${Number(major) + 1}.0.0`;
    }

    return newVersion;
}



const packagesDir = join(import.meta.dirname, '../packages');
const packages = await readdir(packagesDir);

for (const pkg of packages) {
  const packageJson = await readFile(join(packagesDir, pkg, 'package.json'), 'utf8');
  const packageJsonObject = JSON.parse(packageJson);
  packageJsonObject.version = updateVersion(packageJsonObject.version);
  await writeFile(join(packagesDir, pkg, 'package.json'), JSON.stringify(packageJsonObject, null, 2));
}

