#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "python-dotenv>=1.0.0",
#   "pyyaml>=6.0.0",
# ]
# ///
"""
FTP Upload Script for Credit Calculator
Downloads external dependencies, prepares files, and uploads to FTP
"""

import os
import sys
import shutil
import ftplib
import subprocess
from pathlib import Path
from urllib.request import urlretrieve
from dotenv import load_dotenv
from config_utils import load_config, apply_loan_parameters, print_msg, Colors

def download_d3js(build_dir):
    """Download D3.js library locally"""
    print_msg("📦 Downloading D3.js library...", Colors.BLUE)
    
    lib_dir = build_dir / "lib"
    lib_dir.mkdir(exist_ok=True)
    
    d3_url = "https://d3js.org/d3.v7.min.js"
    d3_path = lib_dir / "d3.v7.min.js"
    
    try:
        urlretrieve(d3_url, d3_path)
        print_msg("✅ D3.js downloaded successfully", Colors.GREEN)
        return True
    except Exception as e:
        print_msg(f"❌ Error downloading D3.js: {e}", Colors.RED)
        return False


def prepare_files(build_dir, config=None):
    """Copy necessary files to build directory"""
    print_msg("📄 Copying application files...", Colors.BLUE)
    
    # Create directories
    (build_dir / "css").mkdir(exist_ok=True)
    (build_dir / "js").mkdir(exist_ok=True)
    
    # Copy CSS files
    shutil.copy("css/styles.css", build_dir / "css/")
    shutil.copy("css/components.css", build_dir / "css/")
    
    # Copy JS files
    js_files = ["ui.js", "calculator.js", "charts.js", "optimizer.js", "utils.js", "animations.js"]
    for js_file in js_files:
        shutil.copy(f"js/{js_file}", build_dir / "js/")
    
    # Modify index.html to use local D3.js and apply config
    print_msg("🔧 Updating index.html...", Colors.BLUE)
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace CDN D3.js with local version
    content = content.replace(
        '<script src="https://d3js.org/d3.v7.min.js"></script>',
        '<script src="lib/d3.v7.min.js"></script>'
    )
    
    # Apply loan parameters from config
    if config and 'loan' in config:
        content = apply_loan_parameters(content, config['loan'])
    
    with open(build_dir / "index.html", "w", encoding="utf-8") as f:
        f.write(content)
    
    print_msg("✅ Files prepared successfully", Colors.GREEN)

def upload_to_ftp(build_dir, host, user, password, remote_dir):
    """Upload files to FTP server"""
    print_msg("📤 Connecting to FTP server...", Colors.BLUE)
    
    try:
        # Connect to FTP
        ftp = ftplib.FTP(host)
        ftp.login(user, password)
        print_msg(f"✅ Connected to {host}", Colors.GREEN)
        
        # Change to remote directory or create it
        try:
            ftp.cwd(remote_dir)
        except ftplib.error_perm:
            print_msg(f"Creating remote directory: {remote_dir}", Colors.YELLOW)
            # Create directory structure
            parts = remote_dir.strip('/').split('/')
            current = '/'
            for part in parts:
                try:
                    ftp.cwd(f"{current}{part}")
                    current = f"{current}{part}/"
                except ftplib.error_perm:
                    ftp.mkd(f"{current}{part}")
                    ftp.cwd(f"{current}{part}")
                    current = f"{current}{part}/"
        
        # Create subdirectories
        for subdir in ['css', 'js', 'lib']:
            try:
                ftp.mkd(subdir)
            except ftplib.error_perm:
                pass  # Directory already exists
        
        # Upload index.html
        print_msg("📤 Uploading index.html...", Colors.BLUE)
        with open(build_dir / "index.html", "rb") as f:
            ftp.storbinary("STOR index.html", f)
        
        # Upload CSS files
        print_msg("📤 Uploading CSS files...", Colors.BLUE)
        ftp.cwd("css")
        for css_file in (build_dir / "css").glob("*.css"):
            with open(css_file, "rb") as f:
                ftp.storbinary(f"STOR {css_file.name}", f)
        ftp.cwd("..")
        
        # Upload JS files
        print_msg("📤 Uploading JS files...", Colors.BLUE)
        ftp.cwd("js")
        for js_file in (build_dir / "js").glob("*.js"):
            with open(js_file, "rb") as f:
                ftp.storbinary(f"STOR {js_file.name}", f)
        ftp.cwd("..")
        
        # Upload lib files (D3.js)
        print_msg("📤 Uploading library files...", Colors.BLUE)
        ftp.cwd("lib")
        for lib_file in (build_dir / "lib").glob("*.js"):
            with open(lib_file, "rb") as f:
                ftp.storbinary(f"STOR {lib_file.name}", f)
        ftp.cwd("..")
        
        ftp.quit()
        
        print_msg("✅ Upload completed successfully!", Colors.GREEN)
        print_msg("\n📊 Uploaded files:", Colors.BLUE)
        print_msg("   - index.html", Colors.BLUE)
        print_msg("   - css/styles.css", Colors.BLUE)
        print_msg("   - css/components.css", Colors.BLUE)
        print_msg("   - js/ui.js", Colors.BLUE)
        print_msg("   - js/calculator.js", Colors.BLUE)
        print_msg("   - js/charts.js", Colors.BLUE)
        print_msg("   - js/optimizer.js", Colors.BLUE)
        print_msg("   - js/utils.js", Colors.BLUE)
        print_msg("   - js/animations.js", Colors.BLUE)
        print_msg("   - lib/d3.v7.min.js", Colors.BLUE)
        
        return True
        
    except ftplib.all_errors as e:
        print_msg(f"❌ FTP Error: {e}", Colors.RED)
        return False

def main():
    """Main execution function"""
    print_msg("🚀 Starting FTP Upload Process...", Colors.BLUE)
    
    # Load configuration from config.yml
    config = load_config("config.yml")
    
    # Check if .env file exists, if not try to use config.yml
    ftp_host = None
    ftp_user = None
    ftp_password = None
    ftp_remote_dir = "/"
    
    if os.path.exists(".env"):
        # Load environment variables from .env
        print_msg("📋 Loading FTP credentials from .env...", Colors.BLUE)
        load_dotenv()
        
        ftp_host = os.getenv("FTP_HOST")
        ftp_user = os.getenv("FTP_USER")
        ftp_password = os.getenv("FTP_PASSWORD")
        ftp_remote_dir = os.getenv("FTP_REMOTE_DIR", "/")
    elif config and 'ftp' in config:
        # Use config.yml as fallback
        print_msg("📋 Loading FTP credentials from config.yml...", Colors.BLUE)
        ftp_host = config['ftp'].get('host')
        ftp_user = config['ftp'].get('user')
        ftp_password = config['ftp'].get('password')
        ftp_remote_dir = config['ftp'].get('remote_dir', '/')
    else:
        print_msg("❌ Error: No FTP credentials found!", Colors.RED)
        print_msg("📝 Please create a .env file or configure config.yml", Colors.YELLOW)
        sys.exit(1)
    
    # Validate credentials
    if not all([ftp_host, ftp_user, ftp_password]):
        print_msg("❌ Error: Missing required FTP credentials!", Colors.RED)
        print_msg("Required: FTP_HOST, FTP_USER, FTP_PASSWORD", Colors.YELLOW)
        sys.exit(1)
    
    # Create build directory
    build_dir = Path(".build")
    print_msg("📁 Creating build directory...", Colors.BLUE)
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir()
    
    try:
        # Apply config to local index.html first
        print_msg("🔧 Applying config to local index.html...", Colors.BLUE)
        apply_config_script = Path("apply-config.py")
        if apply_config_script.exists():
            import subprocess
            result = subprocess.run([sys.executable, str(apply_config_script)], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print_msg(f"⚠️  Warning: Failed to apply config to local file", Colors.YELLOW)
            else:
                print_msg("✅ Local index.html updated", Colors.GREEN)
        
        # Download D3.js
        if not download_d3js(build_dir):
            sys.exit(1)
        
        # Prepare files (with config)
        prepare_files(build_dir, config)
        
        # Upload to FTP
        if not upload_to_ftp(build_dir, ftp_host, ftp_user, ftp_password, ftp_remote_dir):
            sys.exit(1)
        
        print_msg("🎉 Deployment complete!", Colors.GREEN)
        print_msg(f"Your calculator is now live at: http://{ftp_host}{ftp_remote_dir}", Colors.GREEN)
        
    finally:
        # Clean up build directory
        print_msg("🧹 Cleaning up...", Colors.BLUE)
        if build_dir.exists():
            shutil.rmtree(build_dir)

if __name__ == "__main__":
    main()
