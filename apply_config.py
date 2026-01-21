#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "pyyaml>=6.0.0",
# ]
# ///
"""
Apply configuration values from config.yml to index.html
This script reads loan parameters from config.yml and injects them into index.html
"""

import re
import sys
from pathlib import Path
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
        print_msg(f"❌ Error: {config_path} not found!", Colors.RED)
        sys.exit(1)
    except yaml.YAMLError as e:
        print_msg(f"❌ Error parsing YAML: {e}", Colors.RED)
        sys.exit(1)

def apply_loan_parameters(html_content, loan_config):
    """Apply loan parameters to HTML content"""
    print_msg("🔧 Applying loan parameters to HTML...", Colors.BLUE)
    
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
    
    return html_content

def apply_config_to_html(input_html="index.html", output_html=None, config_path="config.yml"):
    """
    Apply configuration to HTML file
    
    Args:
        input_html: Source HTML file
        output_html: Output HTML file (if None, overwrites input_html)
        config_path: Path to config.yml file
    """
    print_msg("🚀 Starting configuration application...", Colors.BLUE)
    
    # Load configuration
    config = load_config(config_path)
    
    if 'loan' not in config:
        print_msg("❌ Error: 'loan' section not found in config!", Colors.RED)
        sys.exit(1)
    
    # Read HTML file
    print_msg(f"📄 Reading {input_html}...", Colors.BLUE)
    try:
        with open(input_html, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print_msg(f"❌ Error: {input_html} not found!", Colors.RED)
        sys.exit(1)
    
    # Apply loan parameters
    html_content = apply_loan_parameters(html_content, config['loan'])
    
    # Write output
    output_file = output_html or input_html
    print_msg(f"💾 Writing to {output_file}...", Colors.BLUE)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print_msg("✅ Configuration applied successfully!", Colors.GREEN)
    
    # Print summary
    print_msg("\n📊 Applied values:", Colors.BLUE)
    print_msg(f"   Loan Amount: €{config['loan']['principal']['value']:,}", Colors.BLUE)
    print_msg(f"   Nominal Rate: {config['loan']['interest_rate']['value']}%", Colors.BLUE)
    print_msg(f"   Effective Rate: {config['loan']['effective_rate']['value']}%", Colors.BLUE)
    print_msg(f"   Repayment Rate: {config['loan']['tilgung']['value']}%", Colors.BLUE)
    print_msg(f"   Duration: {config['loan']['duration']['value']} years", Colors.BLUE)
    print_msg(f"   Special Payment: €{config['loan']['default_special_payment']['value']:,}", Colors.BLUE)

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Apply configuration values from config.yml to index.html'
    )
    parser.add_argument(
        '-i', '--input',
        default='index.html',
        help='Input HTML file (default: index.html)'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output HTML file (default: overwrites input file)'
    )
    parser.add_argument(
        '-c', '--config',
        default='config.yml',
        help='Configuration file (default: config.yml)'
    )
    
    args = parser.parse_args()
    
    apply_config_to_html(
        input_html=args.input,
        output_html=args.output,
        config_path=args.config
    )

if __name__ == "__main__":
    main()
