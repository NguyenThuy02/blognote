from PIL import Image
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
import json
import sys
import numpy as np
import cv2


def configure_cloudinary(cloud_name, api_key, api_secret):
    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)


def detect_background_color(image):
    pixel = image.getpixel((0, 0))
    print(f"Detected background color: {pixel}")
    return pixel


def is_valid_size(w, h, min_size=55, max_size=300):
    return min_size <= w <= max_size and min_size <= h <= max_size


def split_by_background(sprite_path, temp_dir, background_color=None, margin=10, cluster=""):
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    try:
        sprite = Image.open(sprite_path)
        if sprite.mode != 'RGBA':
            sprite = sprite.convert('RGBA')
    except Exception as e:
        print(f"Error opening sprite sheet: {str(e)}")
        raise

    if background_color is None:
        background_color = detect_background_color(sprite)

    sprite_np = np.array(sprite)
    mask = np.any(sprite_np[:, :, :3] != background_color[:3], axis=-1).astype(np.uint8) * 255

    kernel = np.ones((10, 10), np.uint8)
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(dilated_mask, connectivity=8)

    sticker_urls = []
    sprite_width, sprite_height = sprite.size
    valid_index = 1  # đánh số liên tục cho ảnh hợp lệ

    for i in range(1, num_labels):
        x, y, w, h, area = stats[i]
        if area < 100 or not is_valid_size(w, h):
            print(f"Skipping cluster {i} (w={w}, h={h}) - Invalid size")
            continue

        min_x = max(0, x - margin)
        max_x = min(sprite_width, x + w + margin)
        min_y = max(0, y - margin)
        max_y = min(sprite_height, y + h + margin)

        file_name = f"{cluster}-{valid_index}.png"
        temp_path = os.path.join(temp_dir, file_name)

        sticker = sprite.crop((min_x, min_y, max_x, max_y))
        sticker.save(temp_path, 'PNG')

        try:
            response = cloudinary.uploader.upload(
                temp_path,
                public_id=f"stickers/{cluster}/sticker-{cluster}-{valid_index}",
                folder="stickers"
            )
            sticker_urls.append(response['secure_url'])
            print(f"Uploaded: {response['secure_url']}")
        except Exception as e:
            print(f"Error uploading to Cloudinary: {str(e)}")
            sticker_urls.append(f"Failed to upload sticker-{cluster}-{valid_index}")

        valid_index += 1  # chỉ tăng nếu là ảnh hợp lệ

    return sticker_urls


def process_images_in_directory(directory_path, temp_dir, cloud_name, api_key, api_secret, cache_file):
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            try:
                cached_urls = json.load(f)
            except json.JSONDecodeError:
                cached_urls = []
    else:
        cached_urls = []

    processed_images = set()
    for url in cached_urls:
        parts = url.split('/')
        if len(parts) > 1:
            image_name = parts[-2]
            processed_images.add(image_name)

    all_sticker_urls = []

    for filename in os.listdir(directory_path):
        if filename.endswith('.png') or filename.endswith('.jpg'):
            image_name = os.path.splitext(filename)[0]
            cluster = image_name

            if cluster in processed_images:
                print(f"Skipping {filename}, already processed.")
                continue

            sprite_path = os.path.join(directory_path, filename)
            print(f"Processing {sprite_path}...")

            try:
                sticker_urls = split_by_background(sprite_path, temp_dir, cluster=cluster)
                print(f"Processed {sprite_path}, URLs: {json.dumps(sticker_urls)}")
                all_sticker_urls.extend(sticker_urls)
            except Exception as e:
                print(f"Error processing {sprite_path}: {str(e)}")

    if all_sticker_urls:
        cached_urls.extend(all_sticker_urls)
        with open(cache_file, 'w') as f:
            json.dump(cached_urls, f, indent=4)
        print(f"Updated cache file with new URLs at {cache_file}")


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python split_sprite.py <directory_path> <temp_dir> <cloud_name> <api_key> <api_secret>")
        sys.exit(1)

    directory_path = sys.argv[1]
    temp_dir = sys.argv[2]
    cloud_name = sys.argv[3]
    api_key = sys.argv[4]
    api_secret = sys.argv[5]
    cache_file = 'public/cache/sticker_urls.json'

    if not os.path.exists('public/cache'):
        os.makedirs('public/cache')

    configure_cloudinary(cloud_name, api_key, api_secret)

    try:
        process_images_in_directory(directory_path, temp_dir, cloud_name, api_key, api_secret, cache_file)
    except Exception as e:
        print(f"Error in script: {str(e)}")
        sys.exit(1)
