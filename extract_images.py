#!/usr/bin/env python3
import fitz  # PyMuPDF
import os

# PDF文件路径
pdf_path = "/Users/apple/Desktop/2024年上海市中考物理真题（解析卷）.pdf"
output_dir = "images"

# 创建输出目录
os.makedirs(output_dir, exist_ok=True)

# 打开PDF
doc = fitz.open(pdf_path)

print(f"PDF共有 {len(doc)} 页")

# 提取每页的图片
image_count = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    
    print(f"第 {page_num + 1} 页找到 {len(image_list)} 张图片")
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # 保存图片
        image_filename = f"page{page_num + 1}_img{img_index + 1}.{image_ext}"
        image_path = os.path.join(output_dir, image_filename)
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        
        image_count += 1
        print(f"  保存: {image_filename}")

print(f"\n总共提取了 {image_count} 张图片到 {output_dir} 目录")
doc.close()
