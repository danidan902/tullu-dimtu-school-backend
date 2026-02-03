import Teacher from "../models/Teacher.js";
// import  cloudinary  from "../config/cloudinary.js";
import cloudinaryUtils from "../config/cloudinary.js";

const { cloudinary } = cloudinaryUtils;

export const uploadTeacher = async (req, res) => {
  try {
    const data = req.body || {}; // fallback to empty object

    let uploadedImage = null;

    if (data.profileImage) {
      const upload = await cloudinary.uploader.upload(data.profileImage, {
        folder: "teachers"
      });
      uploadedImage = upload.secure_url;
    }

    const teacher = new Teacher({
      ...data,
      profileImage: uploadedImage,
    });

    await teacher.save();

    res.json({ message: "Teacher profile saved!", teacher });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


