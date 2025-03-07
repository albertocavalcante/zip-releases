import argparse
import ruamel.yaml # type: ignore

def update_workflow_options(workflow_path, binaries_path):
    # Setup YAML parser to preserve comments and formatting
    yaml = ruamel.yaml.YAML()
    yaml.preserve_quotes = True
    yaml.width = 88

    # Load binaries.yml to get the options
    with open(binaries_path, 'r') as f:
        binaries_config = yaml.load(f)

    binary_types = list(binaries_config['binaries'].keys())

    # Load the workflow file
    with open(workflow_path, 'r') as f:
        workflow = yaml.load(f)
        
    # Update the options
    workflow['on']['workflow_dispatch']['inputs']['binary_type']['options'] = binary_types

    # Write the updated workflow back
    with open(workflow_path, 'w') as f:
        yaml.dump(workflow, f)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Update workflow binary type options')
    parser.add_argument('--workflow', required=True, help='Path to workflow YAML file')
    parser.add_argument('--config', required=True, help='Path to binaries config YAML file')
    args = parser.parse_args()
    
    update_workflow_options(args.workflow, args.config) 