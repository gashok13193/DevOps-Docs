#!/usr/bin/env python3
"""
PowerPoint Generator - Run All Examples

This script runs all available PowerPoint generation examples
and provides a comprehensive overview of the capabilities.
"""

import os
import sys
from datetime import datetime

# Import our modules
from ppt_generator import create_sample_devops_presentation
from simple_ppt_example import create_simple_presentation
from demo_all_features import create_comprehensive_demo

def run_all_examples():
    """Run all PowerPoint generation examples."""
    
    print("🚀 PowerPoint Generator - Running All Examples")
    print("=" * 60)
    print(f"📅 Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    examples = []
    
    try:
        # 1. Simple example
        print("📝 1. Creating Simple Example...")
        simple_path = create_simple_presentation()
        examples.append({
            "name": "Simple Example",
            "path": simple_path,
            "description": "Basic demonstration with 4 slides"
        })
        print("   ✅ Completed\n")
        
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    try:
        # 2. DevOps presentation
        print("📊 2. Creating DevOps Best Practices Presentation...")
        devops_path = create_sample_devops_presentation()
        examples.append({
            "name": "DevOps Best Practices",
            "path": devops_path,
            "description": "Comprehensive DevOps presentation with charts"
        })
        print("   ✅ Completed\n")
        
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    try:
        # 3. Comprehensive demo
        print("🎯 3. Creating Comprehensive Feature Demo...")
        demo_path = create_comprehensive_demo()
        examples.append({
            "name": "Comprehensive Demo",
            "path": demo_path,
            "description": "23-slide showcase of all features"
        })
        print("   ✅ Completed\n")
        
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Summary
    print("📋 SUMMARY")
    print("=" * 60)
    
    if examples:
        total_size = 0
        for i, example in enumerate(examples, 1):
            size_kb = os.path.getsize(example["path"]) / 1024
            total_size += size_kb
            print(f"{i}. {example['name']}")
            print(f"   📁 File: {os.path.basename(example['path'])}")
            print(f"   📊 Size: {size_kb:.1f} KB")
            print(f"   📄 Description: {example['description']}")
            print()
        
        print(f"🎉 Successfully created {len(examples)} presentations!")
        print(f"📊 Total size: {total_size:.1f} KB")
        print(f"📂 All files saved in: {os.getcwd()}")
        
        # List all generated files
        print("\n📁 Generated Files:")
        pptx_files = [f for f in os.listdir('.') if f.endswith('.pptx')]
        for file in sorted(pptx_files):
            size_kb = os.path.getsize(file) / 1024
            print(f"   • {file} ({size_kb:.1f} KB)")
        
    else:
        print("❌ No presentations were created successfully.")
    
    print("\n🎯 Features Demonstrated:")
    print("   • Title slides with custom formatting")
    print("   • Content slides with bullet points")
    print("   • Two-column comparison layouts")
    print("   • Section divider slides with backgrounds")
    print("   • Charts (column, line, pie)")
    print("   • Custom themes and color schemes")
    print("   • Professional business formatting")
    print("   • DevOps and technical content")
    
    print("\n💡 Next Steps:")
    print("   1. Open any .pptx file in PowerPoint or LibreOffice")
    print("   2. Customize the PPTGenerator class for your needs")
    print("   3. Integrate into your CI/CD pipelines")
    print("   4. Create data-driven presentations")
    print("   5. Automate your reporting workflows")
    
    print("\n📚 Resources:")
    print("   • README_PPT.md - Complete documentation")
    print("   • ppt_generator.py - Main generator class")
    print("   • simple_ppt_example.py - Basic usage")
    print("   • demo_all_features.py - Advanced features")
    
    return examples

def main():
    """Main function."""
    try:
        run_all_examples()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()