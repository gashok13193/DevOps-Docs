# PowerPoint Presentation Generator 🎯

A comprehensive Python-based PowerPoint presentation generator that allows you to create professional presentations programmatically. Perfect for DevOps automation, technical documentation, and generating data-driven presentations.

## Features ✨

- **Multiple Slide Types**: Title slides, content slides, two-column layouts, section dividers, image slides, and chart slides
- **Professional Formatting**: Customizable fonts, colors, and themes
- **Chart Support**: Column charts, line charts, and pie charts
- **Image Integration**: Add images with captions
- **Interactive CLI**: Menu-driven interface for easy presentation creation
- **DevOps Focus**: Pre-built templates for technical presentations
- **Automation Ready**: Perfect for CI/CD pipelines and automated reporting

## Installation 🚀

### Prerequisites
- Python 3.8 or higher
- Virtual environment (recommended)

### Setup
1. Create and activate a virtual environment:
```bash
python3 -m venv ppt_env
source ppt_env/bin/activate  # On Windows: ppt_env\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install python-pptx Pillow lxml XlsxWriter typing-extensions
```

## Quick Start 🏃‍♂️

### 1. Simple Example
```python
from ppt_generator import PPTGenerator

# Create a new presentation
ppt = PPTGenerator()

# Add a title slide
ppt.add_title_slide("My Presentation", "Subtitle", "Author")

# Add content slide
ppt.add_content_slide("Key Points", [
    "First important point",
    "Second important point",
    "Third important point"
])

# Save the presentation
ppt.save("my_presentation.pptx")
```

### 2. Run the Interactive Generator
```bash
python ppt_generator.py
```

### 3. Create a Simple Example
```bash
python simple_ppt_example.py
```

## Available Slide Types 📋

### 1. Title Slide
```python
ppt.add_title_slide(
    title="Main Title",
    subtitle="Subtitle text",
    author="Author Name"
)
```

### 2. Content Slide (Bullet Points)
```python
ppt.add_content_slide(
    title="Slide Title",
    content=[
        "First bullet point",
        "Second bullet point",
        "Third bullet point"
    ],
    layout_type="bullet"  # or "numbered"
)
```

### 3. Two-Column Slide
```python
ppt.add_two_column_slide(
    title="Comparison",
    left_content=[
        "Left column header",
        "• Point 1",
        "• Point 2"
    ],
    right_content=[
        "Right column header",
        "• Point A",
        "• Point B"
    ]
)
```

### 4. Chart Slide
```python
chart_data = {
    "categories": ["Q1", "Q2", "Q3", "Q4"],
    "series": [
        {
            "name": "Sales",
            "values": [100, 150, 120, 200]
        }
    ]
}

ppt.add_chart_slide(
    title="Sales Performance",
    chart_data=chart_data,
    chart_type="column"  # "line", "pie"
)
```

### 5. Image Slide
```python
ppt.add_image_slide(
    title="Architecture Diagram",
    image_path="path/to/image.png",
    caption="System Architecture Overview"
)
```

### 6. Section Divider Slide
```python
ppt.add_section_slide(
    section_title="New Section",
    background_color=(31, 73, 125)  # RGB tuple
)
```

## Customization 🎨

### Theme Colors
```python
ppt = PPTGenerator()

# Set custom theme colors
ppt.set_theme_colors(
    primary_color=(31, 73, 125),    # Dark blue
    accent_color=(79, 129, 189)     # Light blue
)
```

### Font Sizes
The generator uses predefined font sizes:
- Title: 44pt
- Subtitle: 28pt
- Content: 18pt
- Slide titles: 36pt

## Examples 📖

### DevOps Presentation
The generator includes a complete sample DevOps presentation covering:
- DevOps introduction and best practices
- CI/CD pipeline stages
- Infrastructure as Code tools
- Monitoring and observability
- Charts showing deployment frequency comparisons

### Generated Files
Running the examples will create:
- `simple_example.pptx` - Basic demonstration
- `devops_presentation_YYYYMMDD_HHMMSS.pptx` - Comprehensive DevOps presentation

## Advanced Usage 🔧

### Using Templates
```python
ppt = PPTGenerator(template_path="path/to/template.pptx")
```

### Custom Chart Data
```python
chart_data = {
    "categories": ["Category 1", "Category 2", "Category 3"],
    "series": [
        {"name": "Series 1", "values": [10, 20, 30]},
        {"name": "Series 2", "values": [15, 25, 35]}
    ]
}
```

### Multiple Presentations
```python
ppt1 = PPTGenerator()
ppt1.add_title_slide("Presentation 1", "First presentation")
ppt1.save("presentation1.pptx")

ppt2 = PPTGenerator()
ppt2.add_title_slide("Presentation 2", "Second presentation")
ppt2.save("presentation2.pptx")
```

## Use Cases 💼

### 1. DevOps Automation
- Automated status reports
- Infrastructure documentation
- CI/CD pipeline reports
- Monitoring dashboards export

### 2. Data-Driven Presentations
- Performance metrics visualization
- KPI reporting
- Analytics presentations
- A/B testing results

### 3. Technical Documentation
- System architecture presentations
- API documentation
- Training materials
- Process documentation

### 4. CI/CD Integration
```bash
# In your CI/CD pipeline
python generate_status_report.py
```

## File Structure 📁

```
.
├── ppt_generator.py          # Main PowerPoint generator class
├── simple_ppt_example.py     # Simple usage example
├── requirements.txt          # Python dependencies
├── README_PPT.md            # This documentation
├── simple_example.pptx      # Generated simple example
└── devops_presentation_*.pptx # Generated DevOps presentation
```

## Dependencies 📦

- `python-pptx`: Core PowerPoint manipulation library
- `Pillow`: Image processing
- `lxml`: XML processing
- `XlsxWriter`: Excel file writing capabilities
- `typing-extensions`: Enhanced type hints

## Troubleshooting 🔧

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed in your virtual environment
2. **File Permission Errors**: Make sure you have write permissions in the output directory
3. **Image Not Found**: Verify image paths exist when using `add_image_slide()`
4. **Template Issues**: Check template file exists and is a valid .pptx file

### Error Messages
- `Required libraries not found`: Install missing dependencies with pip
- `AttributeError: 'SlidePlaceholders'`: Update to latest version of python-pptx

## Contributing 🤝

Feel free to enhance the generator with:
- Additional slide layouts
- More chart types
- Enhanced styling options
- Additional export formats
- Better error handling

## Performance 📊

The generator can create:
- Simple presentations (5-10 slides): < 1 second
- Complex presentations (50+ slides): < 5 seconds
- File sizes: Typically 30-100 KB for text-based slides

## Security 🔒

- No external network calls required
- Works entirely offline
- Generates standard .pptx files
- No sensitive data exposed

## License 📄

This PowerPoint generator is provided as-is for educational and professional use.

---

**Created with ❤️ for the DevOps and automation community**

Happy presenting! 🎉