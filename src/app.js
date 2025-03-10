const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dlaoxrnad",
  api_key: "527615582374857",
  api_secret: "15KO2h9761F2QNoj1taROHh5Q4Q",
});

cloudinary.uploader.upload("/blognote/public", function (error, result) {
  console.log(result, error);
});
