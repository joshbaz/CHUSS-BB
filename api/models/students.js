const mongoose = require('mongoose')

const studentSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        registrationNumber: {
            type: String,
            required: true,
        },
        studentName: String,
        graduate_program_type: String,
        degree_program: String,
        semester: String,
        academicYear: String,
        schoolName: String,
        departmentName: String,
        phoneNumber: String,
        email: String,
        alternative_email: String,
    },
    { timestamp: true }
)

module.exports = mongoose.model('students', studentSchema)
