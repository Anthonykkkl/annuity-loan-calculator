"""
Shared utilities for applying configuration to HTML files
"""

import re
import yaml

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_msg(message, color=Colors.BLUE):
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")

def load_config(config_path="config.yml"):
    """Load configuration from YAML file"""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        print_msg(f"✅ Loaded configuration from {config_path}", Colors.GREEN)
        return config
    except FileNotFoundError:
        print_msg(f"⚠️  Warning: {config_path} not found, using default values", Colors.YELLOW)
        return None
    except yaml.YAMLError as e:
        print_msg(f"⚠️  Warning: Error parsing YAML: {e}, using default values", Colors.YELLOW)
        return None

def apply_loan_parameters(html_content, loan_config):
    """Apply loan parameters to HTML content"""
    if not loan_config:
        return html_content
    
    print_msg("🔧 Applying loan parameters from config.yml...", Colors.BLUE)
    
    replacements = {
        'principal': loan_config['principal']['value'],
        'interest-rate': loan_config['interest_rate']['value'],
        'effective-rate': loan_config['effective_rate']['value'],
        'tilgung': loan_config['tilgung']['value'],
        'duration': loan_config['duration']['value'],
        'default-special-payment': loan_config['default_special_payment']['value'],
    }
    
    for field_id, value in replacements.items():
        # Pattern to match the value attribute in input fields
        pattern = rf'(<input[^>]*id="{field_id}"[^>]*value=")([^"]*)(")'
        replacement = rf'\g<1>{value}\g<3>'
        html_content = re.sub(pattern, replacement, html_content)
        print_msg(f"   ✓ Set {field_id} = {value}", Colors.GREEN)
    
    # Also update placeholder for default-special-payment if it exists
    if 'default_special_payment' in loan_config and 'placeholder' in loan_config['default_special_payment']:
        placeholder_value = loan_config['default_special_payment']['placeholder']
        pattern = rf'(<input[^>]*id="default-special-payment"[^>]*placeholder=")([^"]*)(")'
        replacement = rf'\g<1>{placeholder_value}\g<3>'
        html_content = re.sub(pattern, replacement, html_content)
        print_msg(f"   ✓ Set default-special-payment placeholder = {placeholder_value}", Colors.GREEN)
    
    return html_content
