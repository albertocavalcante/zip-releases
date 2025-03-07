const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * @typedef {Object} BinaryConfig
 * @property {string} title - Display name of the binary
 * @property {string} url_template - Template for download URL with {version} placeholder
 * @property {string} filename_template - Template for binary filename with {version} placeholder
 * @property {string} compressed_name_template - Template for compressed filename with {version} placeholder
 */

/**
 * @typedef {Object} ProcessedBinaryConfig
 * @property {string} url - The processed download URL
 * @property {string} filename - The processed binary filename
 * @property {string} compressed - The processed compressed filename
 * @property {string} title - Display name of the binary
 */

/**
 * Load binary configurations from YAML file
 * @returns {Object.<string, BinaryConfig>} Map of binary configurations
 * @throws {Error} If config file cannot be read or parsed
 */
function loadBinaryConfigs() {
  const configPath = path.join(__dirname, '../../../binaries.yml');
  const configContent = fs.readFileSync(configPath, 'utf8');
  return yaml.load(configContent).binaries;
}

const BINARY_CONFIGS = loadBinaryConfigs();

/**
 * Format a template string by replacing placeholders
 * @param {string} template - Template string with {version} placeholders
 * @param {string} version - Version string to insert
 * @returns {string} Formatted string
 */
function formatTemplate(template, version) {
  return template
    .replace('{version}', version)
    .replace('{clean_version}', version.replace('v', ''));
}

/**
 * Get processed configuration for a specific binary type and version
 * @param {string} binaryType - Type of binary (e.g., 'bazel_nojdk')
 * @param {string} version - Version string
 * @returns {ProcessedBinaryConfig} Processed configuration
 * @throws {Error} If binary type is not found in config
 */
function getBinaryConfig(binaryType, version) {
  const config = BINARY_CONFIGS[binaryType];
  if (!config) throw new Error(`Unknown binary type: ${binaryType}`);

  return {
    url: formatTemplate(config.url_template, version),
    filename: formatTemplate(config.filename_template, version),
    compressed: formatTemplate(config.compressed_name_template, version),
    title: config.title
  };
}

/**
 * Generate release body text with versioned binary information
 * @param {string} binaryType - Type of binary
 * @param {string} version - Version string
 * @param {string} dateString - Date string for the release
 * @param {string[]} [existingVersions=[]] - Array of existing version strings
 * @returns {string} Formatted release body text
 */
function generateReleaseBody(binaryType, version, dateString, existingVersions = []) {
  const config = getBinaryConfig(binaryType, version);

  const header = [
    '# Zip Assets of Binaries',
    '',
    'This repository provides Windows executables as ZIP files.',
    '',
    '## Available versions by binary type:',
    ''
  ].join('\n');
  
  /** @type {Object.<string, string[]>} */
  const groupedVersions = existingVersions.reduce((acc, line) => {
    for (const [type, cfg] of Object.entries(BINARY_CONFIGS)) {
      if (line.includes(cfg.title)) {
        acc[type] = acc[type] || [];
        acc[type].push(line);
        break;
      }
    }
    return acc;
  }, {});

  groupedVersions[binaryType] = groupedVersions[binaryType] || [];
  groupedVersions[binaryType].unshift(
    `- ${config.title} ${version} (${config.compressed}, added on ${dateString})`
  );

  const sections = Object.entries(groupedVersions).map(([type, versions]) => {
    return [
      `### ${BINARY_CONFIGS[type].title}`,
      ...versions
    ].join('\n');
  });

  return [header, ...sections].join('\n\n');
}

/**
 * Get list of available binary types from config
 * @returns {string[]} Array of binary type identifiers
 */
function getAvailableBinaryTypes() {
  return Object.keys(BINARY_CONFIGS);
}

module.exports = { 
  generateReleaseBody,
  getBinaryConfig,
  getAvailableBinaryTypes
}; 