require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const College = require('./models/Academic/College');
const Department = require('./models/Academic/Department');
const AcademicLevel = require('./models/Academic/AcademicLevel');
const AcademicPeriod = require('./models/Academic/AcademicPeriod');
const Class = require('./models/Academic/Class');
const Module = require('./models/Academic/Module');
const Subject = require('./models/Academic/Subject');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await College.deleteMany({});
    await Department.deleteMany({});
    await AcademicLevel.deleteMany({});
    await AcademicPeriod.deleteMany({});
    await Class.deleteMany({});
    await Module.deleteMany({});
    await Subject.deleteMany({});
    console.log('Cleared existing data');

    // 1. Create Admin
    const admin = await User.create({
  email: 'admin@university.edu',
  password: 'Admin123!',       // ← plain text; the model hashes it ONCE
  role: 'admin',
  displayName: 'System Administrator',
  isActive: true,
  mustChangePassword: false
});
    console.log('✅ Admin created');

    // 2. Create College
    const college = await College.create({
      name: 'College of Health and Medical Sciences',
      code: 'CHMS',
      description: 'College of Health and Medical Sciences'
    });
    console.log('✅ College created');

    // 3. Create Department
    const department = await Department.create({
      name: 'Medicine',
      code: 'MED',
      collegeId: college._id,
      departmentType: 'academic',
      academicModel: 'semester',
      gradingModel: 'GPA',
      progressionPolicy: 'moderate'
    });
    console.log('✅ Department created');

    // 4. Create Academic Levels
    const level1 = await AcademicLevel.create({
      name: 'Year 1',
      code: 'Y1',
      departmentId: department._id,
      order: 1
    });

    const level2 = await AcademicLevel.create({
      name: 'Year 2',
      code: 'Y2',
      departmentId: department._id,
      order: 2
    });

    const level3 = await AcademicLevel.create({
      name: 'Year 3',
      code: 'Y3',
      departmentId: department._id,
      order: 3
    });
    console.log('✅ Academic Levels created');

    // 5. Create Classes
    const class1A = await Class.create({
      name: 'Class A',
      code: 'Y1-A',
      departmentId: department._id,
      academicLevelId: level1._id,
      capacity: 50
    });

    const class1B = await Class.create({
      name: 'Class B',
      code: 'Y1-B',
      departmentId: department._id,
      academicLevelId: level1._id,
      capacity: 50
    });

    const class2A = await Class.create({
      name: 'Class A',
      code: 'Y2-A',
      departmentId: department._id,
      academicLevelId: level2._id,
      capacity: 50
    });
    console.log('✅ Classes created');

    // 6. Create Academic Periods
    const semester1 = await AcademicPeriod.create({
      name: 'Semester 1',
      code: 'S1',
      academicLevelId: level1._id,
      order: 1,
      duration: 4,
      durationUnit: 'months'
    });

    const semester2 = await AcademicPeriod.create({
      name: 'Semester 2',
      code: 'S2',
      academicLevelId: level1._id,
      order: 2,
      duration: 4,
      durationUnit: 'months'
    });
    console.log('✅ Academic Periods created');

    // 7. Create Modules
    const module1 = await Module.create({
      name: 'Basic Medical Sciences',
      code: 'BMS101',
      academicPeriodId: semester1._id,
      category: 'core',
      progressionRule: 'pass_all',
      credit: 6,
      order: 1
    });

    const module2 = await Module.create({
      name: 'Clinical Skills',
      code: 'CLS101',
      academicPeriodId: semester1._id,
      category: 'core',
      progressionRule: 'pass_all',
      credit: 4,
      order: 2
    });
    console.log('✅ Modules created');

    // 8. Create Subjects
    await Subject.create({
      name: 'Anatomy',
      code: 'ANA101',
      moduleId: module1._id,
      weight: 30,
      order: 1
    });

    await Subject.create({
      name: 'Physiology',
      code: 'PHY101',
      moduleId: module1._id,
      weight: 30,
      order: 2
    });

    await Subject.create({
      name: 'Pathology',
      code: 'PAT101',
      moduleId: module1._id,
      weight: 40,
      order: 3
    });

    await Subject.create({
      name: 'Clinical Examination',
      code: 'CLS101',
      moduleId: module2._id,
      weight: 50,
      order: 1
    });

    await Subject.create({
      name: 'Patient Communication',
      code: 'PCM101',
      moduleId: module2._id,
      weight: 50,
      order: 2
    });
    console.log('✅ Subjects created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('📝 Admin Credentials:');
    console.log(`   Email: admin@university.edu`);
    console.log(`   Password: Admin123!`);
    console.log('\n🏫 Academic Structure:');
    console.log(`   College: ${college.name} (${college.code})`);
    console.log(`   Department: ${department.name} (${department.code})`);
    console.log(`   Academic Levels: Year 1, Year 2, Year 3`);
    console.log(`   Classes: Y1-A, Y1-B, Y2-A`);
    console.log(`   Academic Periods: Semester 1, Semester 2`);
    console.log(`   Modules: BMS101, CLS101`);
    console.log(`   Subjects: Anatomy, Physiology, Pathology, Clinical Examination, Patient Communication`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();