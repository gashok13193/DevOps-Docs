#!/usr/bin/env python3
"""
Simple PowerPoint Example

This script demonstrates basic usage of the PPTGenerator class
to create a simple presentation quickly.
"""

from ppt_generator import PPTGenerator

def create_simple_presentation():
    """Create a simple presentation with just a few slides."""
    
    # Create a new presentation
    ppt = PPTGenerator()
    
    # Add a title slide
    ppt.add_title_slide(
        "My First PowerPoint", 
        "Created with Python",
        "Python Developer"
    )
    
    # Add a content slide
    ppt.add_content_slide(
        "Why Use Python for PPT?",
        [
            "Automation saves time",
            "Consistent formatting",
            "Data-driven presentations",
            "Integration with other tools",
            "Version control friendly"
        ]
    )
    
    # Add a two-column slide
    ppt.add_two_column_slide(
        "Pros and Cons",
        [
            "Pros:",
            "• Fast creation",
            "• Reproducible",
            "• Scriptable",
            "• Customizable"
        ],
        [
            "Cons:",
            "• Learning curve",
            "• Limited design flexibility",
            "• Requires programming knowledge"
        ]
    )
    
    # Add a section slide
    ppt.add_section_slide("Thank You!")
    
    # Save the presentation
    filename = "simple_example.pptx"
    saved_path = ppt.save(filename)
    
    print(f"✅ Simple presentation created!")
    print(f"📁 Saved as: {saved_path}")
    print(f"📄 Total slides: {ppt.get_slide_count()}")
    
    return saved_path

if __name__ == "__main__":
    create_simple_presentation()