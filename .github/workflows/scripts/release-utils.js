function generateReleaseBody(version, dateString, existingVersions = []) {
  const header = [
    '# Zip Assets of Binaries',
    '',
    'This repository provides Windows executables as ZIP files.',
    '',
    '## Available versions:'
  ].join('\n');
  
  const newVersion = `- ${version} (bazel_nojdk-${version}-windows-x86_64.zip, added on ${dateString})`;
  
  return [
    header,
    newVersion,
    ...existingVersions
  ].join('\n');
}

module.exports = { generateReleaseBody }; 