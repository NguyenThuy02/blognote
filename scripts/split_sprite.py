from PIL import Image
import os
import cloudinary
import cloudinary.uploader
import json
import sys
from collections import defaultdict


# Cấu hình Cloudinary từ tham số dòng lệnh
def configure_cloudinary(cloud_name, api_key, api_secret):
    print(
        f"Configuring Cloudinary: cloud_name={cloud_name}, api_key={api_key}")
    cloudinary.config(cloud_name=cloud_name,
                      api_key=api_key,
                      api_secret=api_secret)


def detect_background_color(image):
    """Phát hiện màu nền chính của ảnh (giả định là màu ở góc trên trái)."""
    pixel = image.getpixel((0, 0))
    print(f"Detected background color: {pixel}")
    return pixel


def split_by_background(sprite_path,
                        temp_dir,
                        background_color=None,
                        margin=10):
    print(f"Sprite path: {sprite_path}")
    print(f"Temp dir: {temp_dir}")

    if not os.path.exists(temp_dir):
        print("Creating temp directory...")
        os.makedirs(temp_dir)

    # Kiểm tra xem sticker đã tồn tại trong tempDir chưa
    existing_files = [
        f for f in os.listdir(temp_dir)
        if f.startswith('sticker-cluster-') and f.endswith('.png')
    ]
    if existing_files:
        print("Stickers already exist in temp dir, checking Cloudinary...")
        sticker_urls = []
        for file in existing_files:
            temp_path = os.path.join(temp_dir, file)
            public_id = f"stickers/{os.path.basename(sprite_path).split('.')[0]}/{file.replace('.png', '')}"
            try:
                # Kiểm tra trên Cloudinary
                resource = cloudinary.api.resource(public_id)
                sticker_urls.append(resource['secure_url'])
                print(
                    f"Found existing sticker on Cloudinary: {resource['secure_url']}"
                )
            except Exception as e:
                print(
                    f"Sticker {public_id} not found on Cloudinary, re-uploading..."
                )
                response = cloudinary.uploader.upload(temp_path,
                                                      public_id=public_id,
                                                      folder="stickers")
                sticker_urls.append(response['secure_url'])
        return sticker_urls

    print("Opening sprite sheet...")
    try:
        sprite = Image.open(sprite_path)
        if sprite.mode != 'RGBA':
            sprite = sprite.convert('RGBA')
    except Exception as e:
        print(f"Error opening sprite sheet: {str(e)}")
        raise

    if background_color is None:
        background_color = detect_background_color(sprite)

    sprite_width, sprite_height = sprite.size
    print(f"Sprite dimensions: {sprite_width}x{sprite_height}")

    visited = set()
    regions = []

    def flood_fill(x, y):
        if (
                x, y
        ) in visited or x < 0 or x >= sprite_width or y < 0 or y >= sprite_height:
            return None
        pixel = sprite.getpixel((x, y))
        if pixel == background_color:
            return None

        region = set()
        stack = [(x, y)]
        while stack:
            cx, cy = stack.pop()
            if (
                    cx, cy
            ) in visited or cx < 0 or cx >= sprite_width or cy < 0 or cy >= sprite_height:
                continue
            if sprite.getpixel((cx, cy)) != background_color:
                region.add((cx, cy))
                visited.add((cx, cy))
                stack.extend([(cx + 1, cy), (cx - 1, cy), (cx, cy + 1),
                              (cx, cy - 1)])
        return region if region else None

    for y in range(sprite_height):
        for x in range(sprite_width):
            if (x, y) not in visited:
                region = flood_fill(x, y)
                if region:
                    regions.append(region)

    clusters = []
    used = set()

    def is_nearby(region1, region2, threshold=20):
        for x1, y1 in region1:
            for x2, y2 in region2:
                if abs(x1 - x2) <= threshold and abs(y1 - y2) <= threshold:
                    return True
        return False

    for i, region in enumerate(regions):
        if i in used:
            continue
        cluster = region
        used.add(i)
        for j, other_region in enumerate(regions[i + 1:], start=i + 1):
            if j not in used and is_nearby(region, other_region):
                cluster.update(other_region)
                used.add(j)
        clusters.append(cluster)

    sticker_urls = []
    for i, cluster in enumerate(clusters):
        print(f"Processing cluster {i} with {len(cluster)} pixels...")
        min_x = max(0, min(x for x, y in cluster) - margin)
        max_x = min(sprite_width - 1, max(x for x, y in cluster) + margin)
        min_y = max(0, min(y for x, y in cluster) - margin)
        max_y = min(sprite_height - 1, max(y for x, y in cluster) + margin)

        sticker = sprite.crop((min_x, min_y, max_x + 1, max_y + 1))
        temp_path = os.path.join(temp_dir, f'sticker-cluster-{i}.png')
        print(f"Saving temp sticker to: {temp_path}")
        sticker.save(temp_path, 'PNG')

        print(f"Uploading to Cloudinary: sticker-cluster-{i}")
        try:
            response = cloudinary.uploader.upload(
                temp_path,
                public_id=
                f"stickers/{os.path.basename(sprite_path).split('.')[0]}/sticker-cluster-{i}",
                folder="stickers")
            sticker_url = response['secure_url']
            sticker_urls.append(sticker_url)
        except Exception as e:
            print(f"Error uploading to Cloudinary: {str(e)}")
            sticker_urls.append(f"Failed to upload sticker-cluster-{i}")

        # Không xóa temp file để giữ lại cho lần sau
        print(f"Keeping temp file: {temp_path}")

    return sticker_urls


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(
            "Usage: python split_sprite.py <sprite_path> <temp_dir> <cloud_name> <api_key> <api_secret>"
        )
        sys.exit(1)

    sprite_path = sys.argv[1]
    temp_dir = sys.argv[2]
    cloud_name = sys.argv[3]
    api_key = sys.argv[4]
    api_secret = sys.argv[5]

    configure_cloudinary(cloud_name, api_key, api_secret)

    try:
        sticker_urls = split_by_background(sprite_path, temp_dir)
        print(json.dumps(sticker_urls))
    except Exception as e:
        print(f"Error in script: {str(e)}")
        sys.exit(1)
