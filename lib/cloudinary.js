import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("WARNING: Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully configured.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(buffer, originalName, folder = "gradeflow") {
  const publicId = `${folder}/${Date.now()}_${originalName.replace(/\.[^.]+$/, "")}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
}

export function getCloudinaryUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    secure: true,
    sign_url: true,
  });
}

export async function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}
