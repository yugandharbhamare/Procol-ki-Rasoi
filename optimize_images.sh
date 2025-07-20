#!/bin/bash

# Image optimization script for Procol ki Rasoi
echo "🖼️  Starting image optimization..."

# Create optimized directory if it doesn't exist
mkdir -p public/optimized

# Optimize all PNG images
for file in public/*.png; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "📸 Optimizing: $filename"
        
        # Get original file size
        original_size=$(stat -f%z "$file")
        
        # Optimize image: resize to 200x200, compress, and save to optimized folder
        convert "$file" \
            -resize 200x200^ \
            -gravity center \
            -extent 200x200 \
            -quality 85 \
            -strip \
            "public/optimized/$filename"
        
        # Get optimized file size
        optimized_size=$(stat -f%z "public/optimized/$filename")
        
        # Calculate size reduction
        reduction=$((original_size - optimized_size))
        reduction_percent=$((reduction * 100 / original_size))
        
        echo "   ✅ Original: ${original_size} bytes"
        echo "   ✅ Optimized: ${optimized_size} bytes"
        echo "   ✅ Reduction: ${reduction} bytes (${reduction_percent}%)"
        echo ""
    fi
done

echo "🎉 Image optimization complete!"
echo "📁 Optimized images saved to: public/optimized/" 