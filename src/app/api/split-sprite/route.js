import { exec } from "child_process";
import path from "path";
import util from "util";
import fs from "fs/promises";
import { cloudinary } from "../../../../app.js"; // Import từ app.js ở thư mục gốc

const execPromise = util.promisify(exec);

export async function GET(request) {
  const cacheDir = path.join(process.cwd(), "public", "cache");
  const cacheFile = path.join(cacheDir, "sticker_urls.json");
  const imagesDir = path.join(process.cwd(), "public", "images");
  const tempDir = path.join(process.cwd(), "temp", "stickers");
  const scriptPath = path.join(process.cwd(), "scripts", "split_sprite.py");
  const pythonPath =
    "C:\\Users\\thinh\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";

  try {
    console.log("Starting API request...");

    // Kiểm tra cache
    let cachedStickers = {};
    try {
      const cacheData = await fs.readFile(cacheFile, "utf8");
      cachedStickers = JSON.parse(cacheData);
      console.log("Cache found:", cachedStickers);
    } catch (error) {
      console.log("Cache not found, initializing...");
    }

    // Lấy cấu hình Cloudinary từ app.js
    const cloudinaryConfig = {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key,
      api_secret: cloudinary.config().api_secret,
    };
    console.log("Cloudinary config:", {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key.slice(0, 4) + "...",
      api_secret: cloudinaryConfig.api_secret.slice(0, 4) + "...",
    });

    // Đọc và lọc file ảnh trong public/images
    const imageFiles = (await fs.readdir(imagesDir)).filter((file) =>
      /\.(png|jpg|jpeg)$/i.test(file)
    );
    console.log("Found image files:", imageFiles);

    if (imageFiles.length === 0) {
      console.log("No valid image files found in public/images");
      return new Response(
        JSON.stringify({ error: "No images found in public/images" }),
        { status: 404 }
      );
    }

    const allStickerUrls = { ...cachedStickers.urls };

    for (const imageFile of imageFiles) {
      const spritePath = path.join(imagesDir, imageFile);
      const imageName = path.parse(imageFile).name;
      const imageTempDir = path.join(tempDir, imageName);

      console.log(`Checking stickers for ${imageFile}...`);
      let stickersExist = false;
      try {
        const tempFiles = await fs.readdir(imageTempDir);
        console.log(`Temp files in ${imageTempDir}:`, tempFiles);
        if (tempFiles.length > 0 && allStickerUrls[imageName]) {
          console.log(`Stickers for ${imageFile} already exist, skipping...`);
          stickersExist = true;
        }
      } catch (error) {
        console.log(
          `No temp directory for ${imageFile}, proceeding to process...`
        );
      }

      if (!stickersExist) {
        console.log(`Processing image: ${spritePath}`);
        console.log(`Temp dir: ${imageTempDir}`);
        console.log(`Script path: ${scriptPath}`);

        const { stdout, stderr } = await execPromise(
          `"${pythonPath}" "${scriptPath}" "${spritePath}" "${imageTempDir}" "${cloudinaryConfig.cloud_name}" "${cloudinaryConfig.api_key}" "${cloudinaryConfig.api_secret}"`
        );

        if (stderr) {
          console.error(`Python script error for ${imageFile}:`, stderr);
          continue;
        }

        console.log(`Python script output for ${imageFile}:`, stdout);
        const stickerUrls = JSON.parse(stdout);
        allStickerUrls[imageName] = stickerUrls;

        console.log("Updating cache...");
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(
          cacheFile,
          JSON.stringify({ urls: allStickerUrls }),
          "utf8"
        );
      } else {
        console.log(
          `Using existing stickers for ${imageFile}:`,
          allStickerUrls[imageName]
        );
      }
    }

    console.log("API request completed successfully");
    return new Response(JSON.stringify({ stickers: allStickerUrls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error details:", error.stack);
    return new Response(JSON.stringify({ error: "Failed to process images" }), {
      status: 500,
    });
  }
}
