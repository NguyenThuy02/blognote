const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dlaoxrnad",
  api_key: "527615582374857",
  api_secret: "15KO2h9761F2QNoj1taROHh5Q4Q",
});

const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    console.log("Upload Success:", result);
    return result.secure_url; // Trả về URL để dùng sau
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

// Gọi hàm upload (có thể giữ hoặc comment nếu không cần chạy ngay)
uploadImage("./public/BlogNote.png");
uploadImage("./public/login.gif");
uploadImage("./public/search.svg");

// Export cloudinary để route.js dùng
module.exports = { cloudinary };
