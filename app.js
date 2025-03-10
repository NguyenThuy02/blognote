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
  } catch (error) {
    console.error("Upload Error:", error);
  }
};

// Gọi hàm upload
uploadImage("./public/BlogNote.png");
