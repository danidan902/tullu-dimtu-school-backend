import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    dateOfBirth: String,
    address: String,
    gender: String,
    profileImage: String,

    employeeId: String,
    department: String,
    position: String,
    yearsOfExperience: String,
    joiningDate: String,
    currentSubjects: String,

    highestDegree: String,
    university: String,
    graduationYear: String,
    specialization: String,
    additionalQualifications: String,

    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);
