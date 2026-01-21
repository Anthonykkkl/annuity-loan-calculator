#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "pyyaml>=6.0.0",
# ]
# ///
"""
Apply Configuration Script
Applies config.yml values to index.html for local development
"""

from pathlib import Path
from config_utils import load_config, apply_loan_parameters, print_msg, Colors

def main():
    """Main execution function"""
    print_msg("🚀 Applying config.yml to index.html...", Colors.BLUE)
    
    # Load configuration
    config = load_config("config.yml")
    if not config or 'loan' not in config:
        print_msg("❌ Error: No loan configuration found in config.yml", Colors.RED)
        return 1
    
    # Read index.html
    index_path = Path("index.html")
    if not index_path.exists():
        print_msg("❌ Error: index.html not found", Colors.RED)
        return 1
    
    print_msg("📄 Reading index.html...", Colors.BLUE)
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Apply loan parameters
    content = apply_loan_parameters(content, config['loan'])
    
    # Write back to index.html
    print_msg("💾 Writing updated index.html...", Colors.BLUE)
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print_msg("✅ Successfully applied config.yml to index.html!", Colors.GREEN)
    print_msg("💡 You can now run ./run.sh to see the changes", Colors.BLUE)
    return 0

if __name__ == "__main__":
    exit(main())
