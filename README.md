# ZIP Assets Repository

![GitHub release](https://img.shields.io/github/v/release/albertocavalcante/zip-releases)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/albertocavalcante/zip-releases/mirror-binaries.yml)

This repository provides Windows executables as ZIP files. These binaries are mirrored from their official sources and provided for convenience when you need a portable, compressed version of common tools.

## Available Binaries

The repository currently includes the following binaries:

- **Bazel NoJDK** - Bazel build tool without bundled JDK
- *Additional binaries may be added in the future*

## Usage

1. Navigate to the [Releases page](https://github.com/albertocavalcante/zip-releases/releases)
2. Download the desired ZIP file
3. Extract the ZIP file to access the executable
4. Run the executable from any location

## Why ZIP Files?

- **Portability**: Easy to download and transport
- **Convenience**: No installation required
- **Consistency**: Verified binaries from official sources
- **Space Efficiency**: Compressed to save bandwidth and storage

## Available Versions

The repository maintains ZIP versions of multiple binary types and versions. Each release includes metadata showing:

- Binary name and version
- File size
- Date added
- Direct download link

## Requesting New Binaries

If you'd like to request a new binary type or version, please:

1. Check the [Issues](https://github.com/albertocavalcante/zip-releases/issues) to see if it's already requested
2. Open a new issue with the binary name, version, and official download link

## For Contributors

This repository uses GitHub Actions to automate the mirroring process:

1. Binaries are defined in `binaries.yml`
2. Workflow downloads the binary from the official source
3. Compresses it into a ZIP file
4. Uploads it to the GitHub release
5. Updates the release description with the available binaries

### Adding a New Binary Type

To add a new binary type:

1. Fork the repository
2. Add the binary configuration to `binaries.yml`:
   ```yaml
   new_binary_name:
     title: "Display Name"
     url_template: "https://example.com/download/{version}/binary-{clean_version}.exe"
     filename_template: "binary-{clean_version}.exe"
     compressed_name_template: "binary-{clean_version}.zip"
   ```
3. Create a pull request

## License

These binaries are redistributed according to their respective licenses. Please refer to the original projects for license details.

---

*Note: This repository is not affiliated with the original binary developers. All trademarks and registered trademarks are the property of their respective owners.*
