import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to student folder
const uploadToStudentFolder = async (fileBuffer, grade, firstName, lastName, studentId, filename) => {
  return new Promise((resolve, reject) => {
    const folderName = `Grade_${grade}/${firstName.toLowerCase()}_${lastName.toLowerCase()}_${studentId}`;
    
    cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
        resource_type: 'auto',
        overwrite: false
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log(`✅ Uploaded to: ${result.secure_url}`);
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

// Delete student folder
const deleteStudentFolder = async (grade, firstName, lastName, studentId) => {
  const folderName = `Grade_${grade}/${firstName.toLowerCase()}_${lastName.toLowerCase()}_${studentId}`;
  
  try {
    // Delete all resources in the folder
    const result = await cloudinary.api.delete_resources_by_prefix(folderName);
    console.log(`🗑️ Deleted resources from: ${folderName}`);
    
    // Try to delete the folder itself
    try {
      await cloudinary.api.delete_folder(folderName);
      console.log(`🗑️ Deleted folder: ${folderName}`);
    } catch (folderError) {
      console.log('⚠️ Could not delete empty folder, but resources are deleted');
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Export as default
const cloudinaryUtils = {
  uploadToStudentFolder,
  deleteStudentFolder,
  cloudinary
};

export default cloudinaryUtils;