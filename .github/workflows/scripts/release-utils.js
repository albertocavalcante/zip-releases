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

/**
 * Generate an enhanced release description based on the current assets
 * @param {Array} assets - The GitHub release assets
 * @returns {string} Formatted release description
 */
function generateEnhancedReleaseDescription(assets) {
  // Group assets by binary type
  const assetsByType = {};
  
  // Process each asset
  assets.forEach(asset => {
    // Skip non-zip files
    if (!asset.name.endsWith('.zip')) return;
    
    // Find the matching binary type from config
    let foundType = null;
    let version = null;
    
    // Try to match the asset name against our binary configs
    for (const [type, config] of Object.entries(BINARY_CONFIGS)) {
      // Extract version based on filename pattern in config
      const filenameBase = config.compressed_name_template.split('{')[0];
      if (asset.name.startsWith(filenameBase)) {
        foundType = type;
        // Extract version from filename based on template
        const versionMatch = asset.name.match(new RegExp(filenameBase + '([\\d\\.]+)'));
        version = versionMatch ? versionMatch[1] : 'unknown';
        break;
      }
    }
    
    // If no matching type found, use a fallback approach
    if (!foundType) {
      const parts = asset.name.split('-');
      foundType = parts[0];
      version = parts[1] || 'unknown';
    }
    
    // Use the type title from config or fallback to the key
    const typeTitle = BINARY_CONFIGS[foundType]?.title || foundType.replace(/_/g, ' ');
    
    // Store by type title for grouping
    if (!assetsByType[typeTitle]) {
      assetsByType[typeTitle] = [];
    }
    
    // Add this asset
    assetsByType[typeTitle].push({
      name: asset.name,
      version: version,
      url: asset.browser_download_url,
      size: formatFileSize(asset.size),
      date: new Date(asset.created_at).toISOString().split('T')[0]
    });
  });
  
  // Start building the description
  let description = `# Zip Assets of Binaries

This repository provides Windows executables as ZIP files. These binaries are mirrored from their official sources.

## Available versions by binary type:

`;

  // Add sections for each binary type
  Object.keys(assetsByType).sort().forEach(typeTitle => {
    description += `### ${typeTitle}\n\n`;
    
    // Deduplicate by version (keeping newest)
    const versionMap = {};
    assetsByType[typeTitle].forEach(asset => {
      if (!versionMap[asset.version] || new Date(asset.date) > new Date(versionMap[asset.version].date)) {
        versionMap[asset.version] = asset;
      }
    });
    
    // Sort versions (newest first) and add to description
    Object.values(versionMap)
      .sort((a, b) => compareVersions(b.version, a.version))
      .forEach(asset => {
        description += `* **${typeTitle} ${asset.version}** ([${asset.name}](${asset.url}), ${asset.size}, added on ${asset.date})\n`;
      });
    
    description += '\n';
  });
  
  // Add usage information
  description += `## Usage

These ZIP files contain Windows executables. Extract the ZIP file to use the binary.

## Source Information

These binaries are mirrored from their official releases.`;

  return description;
}

/**
 * Format file size in a human-readable way
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Compare semantic versions for sorting
 * @param {string} a - First version
 * @param {string} b - Second version
 * @returns {number} Comparison result
 */
function compareVersions(a, b) {
  const aParts = a.split('.').map(part => parseInt(part, 10) || 0);
  const bParts = b.split('.').map(part => parseInt(part, 10) || 0);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  
  return 0;
}

module.exports = { 
  generateReleaseBody,
  getBinaryConfig,
  getAvailableBinaryTypes,
  generateEnhancedReleaseDescription,
  formatFileSize,
  compareVersions
}; 