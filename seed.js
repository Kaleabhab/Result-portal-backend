require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================
// MODELS
// ============================================================
const User = require('./models/User');
const Student = require('./models/Student');
const AuditLog = require('./models/AuditLog');

const College = require('./models/Academic/College');
const Department = require('./models/Academic/Department');
const AcademicLevel = require('./models/Academic/AcademicLevel');
const AcademicPeriod = require('./models/Academic/AcademicPeriod');
const Class = require('./models/Academic/Class');
const Cohort = require('./models/Academic/Cohort');
const Module = require('./models/Academic/Module');
const Subject = require('./models/Academic/Subject');
const AssessmentComponent = require('./models/Academic/AssessmentComponent');

const Result = require('./models/Result/Result');
const ModuleResult = require('./models/Result/ModuleResult');
const ResultUpdateLog = require('./models/Result/ResultUpdateLog');
const ProgressionRecord = require('./models/Result/ProgressionRecord');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================================
    // CLEAR EXISTING DATA
    // ============================================================
    console.log('\n🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      AuditLog.deleteMany({}),
      College.deleteMany({}),
      Department.deleteMany({}),
      AcademicLevel.deleteMany({}),
      AcademicPeriod.deleteMany({}),
      Class.deleteMany({}),
      Cohort.deleteMany({}),
      Module.deleteMany({}),
      Subject.deleteMany({}),
      AssessmentComponent.deleteMany({}),
      Result.deleteMany({}),
      ModuleResult.deleteMany({}),
      ResultUpdateLog.deleteMany({}),
      ProgressionRecord.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');

    // ============================================================
    // 1. SUPER ADMIN (bootstrap)
    // ============================================================
    console.log('\n👤 Creating Super Admin...');
    const superAdmin = await User.create({
      email: 'superadmin@university.edu',
      password: 'SuperAdmin123!',
      displayName: 'Super Administrator',
      role: 'super_admin',
      isActive: true,
      mustChangePassword: false
    });
    console.log('✅ Super Admin: superadmin@university.edu / SuperAdmin123!');

    // ============================================================
    // 2. COLLEGE
    // ============================================================
    console.log('\n🏫 Creating College...');
    const college = await College.create({
      name: 'College of Health and Medical Sciences',
      code: 'CHMS',
      description: 'College of Health and Medical Sciences'
    });
    console.log(`✅ College: ${college.name} (${college.code})`);

    // ============================================================
    // 3. DEPARTMENT
    // ============================================================
    console.log('\n🏢 Creating Department...');
    const department = await Department.create({
      name: 'Medicine',
      code: 'MED',
      collegeId: college._id,
      departmentType: 'academic',
      academicModel: 'semester',
      gradingModel: 'GPA',
      progressionPolicy: 'moderate'
    });
    console.log(`✅ Department: ${department.name} (${department.code})`);

    // ============================================================
    // 4. IT ADMIN (created by Super Admin)
    // ============================================================
    console.log('\n👤 Creating IT Admin...');
    const itAdmin = await User.create({
      email: 'itadmin@university.edu',
      password: 'ITAdmin123!',
      displayName: 'IT Administrator',
      role: 'it_admin',
      isActive: true,
      mustChangePassword: false,
      createdBy: superAdmin._id
    });
    console.log('✅ IT Admin: itadmin@university.edu / ITAdmin123!');

    // ============================================================
    // 5. DEPARTMENT ADMIN (created by IT Admin)
    // ============================================================
    console.log('\n👤 Creating Department Admin...');
    const departmentAdmin = await User.create({
      email: 'deptadmin@university.edu',
      password: 'DeptAdmin123!',
      displayName: 'Medicine Department Admin',
      role: 'department_admin',
      collegeId: college._id,
      departmentId: department._id,
      isActive: true,
      mustChangePassword: false,
      createdBy: itAdmin._id
    });
    console.log('✅ Department Admin: deptadmin@university.edu / DeptAdmin123!');

    // ============================================================
    // 6. REGISTRATION ADMIN (created by IT Admin)
    // ============================================================
    console.log('\n👤 Creating Registration Admin...');
    const registrationAdmin = await User.create({
      email: 'regadmin@university.edu',
      password: 'RegAdmin123!',
      displayName: 'Registration Administrator',
      role: 'registration_admin',
      collegeId: college._id,
      isActive: true,
      mustChangePassword: false,
      createdBy: itAdmin._id
    });
    console.log('✅ Registration Admin: regadmin@university.edu / RegAdmin123!');

    // ============================================================
    // 7. ACADEMIC LEVELS
    // ============================================================
    console.log('\n📚 Creating Academic Levels...');
    const level1 = await AcademicLevel.create({
      name: 'Year 1', code: 'Y1', departmentId: department._id, order: 1
    });
    const level2 = await AcademicLevel.create({
      name: 'Year 2', code: 'Y2', departmentId: department._id, order: 2
    });
    const level3 = await AcademicLevel.create({
      name: 'Year 3', code: 'Y3', departmentId: department._id, order: 3
    });
    console.log('✅ Academic Levels: Year 1, Year 2, Year 3');

    // ============================================================
    // 8. COHORTS
    // ============================================================
    console.log('\n🎓 Creating Cohorts...');
    const cohort2024 = await Cohort.create({
      name: 'Cohort 2024',
      code: 'COH-2024',
      academicLevelId: level1._id,
      admissionYear: '2024',
      expectedGraduationYear: '2029'
    });
    const cohort2025 = await Cohort.create({
      name: 'Cohort 2025',
      code: 'COH-2025',
      academicLevelId: level1._id,
      admissionYear: '2025',
      expectedGraduationYear: '2030'
    });
    console.log('✅ Cohorts: 2024, 2025');

    // ============================================================
    // 9. CLASSES
    // ============================================================
    console.log('\n👥 Creating Classes...');
    const class1A = await Class.create({
      name: 'Class A', code: 'Y1-A',
      departmentId: department._id,
      academicLevelId: level1._id, capacity: 50
    });
    const class1B = await Class.create({
      name: 'Class B', code: 'Y1-B',
      departmentId: department._id,
      academicLevelId: level1._id, capacity: 50
    });
    const class2A = await Class.create({
      name: 'Class A', code: 'Y2-A',
      departmentId: department._id,
      academicLevelId: level2._id, capacity: 50
    });
    console.log('✅ Classes: Y1-A, Y1-B, Y2-A');

    // ============================================================
    // 10. CLASS ADMIN (created by Department Admin)
    // ============================================================
    console.log('\n👤 Creating Class Admin...');
    const classAdmin = await User.create({
      email: 'classadmin@university.edu',
      password: 'ClassAdmin123!',
      displayName: 'Class A Administrator',
      role: 'class_admin',
      collegeId: college._id,
      departmentId: department._id,
      academicLevelId: level1._id,
      classId: class1A._id,
      isActive: true,
      mustChangePassword: false,
      createdBy: departmentAdmin._id
    });
    console.log('✅ Class Admin: classadmin@university.edu / ClassAdmin123!');
    console.log(`   Scope: ${class1A.name}`);

    // ============================================================
    // 11. ACADEMIC PERIODS
    // ============================================================
    console.log('\n📅 Creating Academic Periods...');
    const s1 = await AcademicPeriod.create({
      name: 'Semester 1', code: 'S1', academicLevelId: level1._id,
      order: 1, duration: 4, durationUnit: 'months'
    });
    const s2 = await AcademicPeriod.create({
      name: 'Semester 2', code: 'S2', academicLevelId: level1._id,
      order: 2, duration: 4, durationUnit: 'months'
    });
    console.log('✅ Academic Periods: Semester 1, Semester 2');

    // ============================================================
    // 12. MODULES
    // ============================================================
    console.log('\n📦 Creating Modules...');
    const moduleBMS = await Module.create({
      name: 'Basic Medical Sciences',
      code: 'BMS101',
      academicPeriodId: s1._id,
      category: 'MAJOR',
      deliveryModel: 'SYSTEM_BASED',
      progressionCharacteristic: 'ONE_YEAR_LAG',
      progressionRule: 'pass_all',
      credit: 6,
      order: 1
    });

    const moduleProfSkills = await Module.create({
      name: 'Professional Skills',
      code: 'PSK101',
      academicPeriodId: s1._id,
      category: 'MINOR',
      deliveryModel: 'ASSESSMENT_BASED',
      progressionCharacteristic: 'NO_LAG',
      progressionRule: 'weighted_average',
      credit: 3,
      order: 2
    });
    console.log('✅ Modules: BMS101 (System-Based), PSK101 (Assessment-Based)');

    // ============================================================
    // 13. SUBJECTS
    // ============================================================
    console.log('\n📚 Creating Subjects...');
    const subAnatomy = await Subject.create({
      name: 'Anatomy', code: 'ANA101', moduleId: moduleBMS._id, weight: 30, order: 1
    });
    const subPhysiology = await Subject.create({
      name: 'Physiology', code: 'PHY101', moduleId: moduleBMS._id, weight: 30, order: 2
    });
    const subPathology = await Subject.create({
      name: 'Pathology', code: 'PAT101', moduleId: moduleBMS._id, weight: 40, order: 3
    });
    console.log('✅ Subjects: Anatomy (30%), Physiology (30%), Pathology (40%)');

    // ============================================================
    // 14. ASSESSMENT COMPONENTS
    // ============================================================
    console.log('\n📝 Creating Assessment Components...');
    await AssessmentComponent.create([
      { name: 'Midterm', code: 'PSK-MID', moduleId: moduleProfSkills._id, componentType: 'MIDTERM', weight: 20, order: 1 },
      { name: 'Assignment', code: 'PSK-ASN', moduleId: moduleProfSkills._id, componentType: 'ASSIGNMENT', weight: 10, order: 2 },
      { name: 'Final Exam', code: 'PSK-FIN', moduleId: moduleProfSkills._id, componentType: 'FINAL_EXAM', weight: 70, order: 3 }
    ]);
    console.log('✅ Assessment Components: Midterm (20%), Assignment (10%), Final (70%)');

    // ============================================================
    // 15. SAMPLE STUDENTS
    // ============================================================
    console.log('\n🎓 Creating Sample Students...');

    const studentsData = [
      { studentId: '1693/16', firstName: 'Alison', lastName: 'Becker', email: 'alison.becker@university.edu', gender: 'female', dateOfBirth: new Date('2000-01-15') },
      { studentId: '1721/16', firstName: 'Hana', lastName: 'Ahmed', email: 'hana.ahmed@university.edu', gender: 'female', dateOfBirth: new Date('2001-03-22') },
      { studentId: '1845/16', firstName: 'Daniel', lastName: 'Ali', email: 'daniel.ali@university.edu', gender: 'male', dateOfBirth: new Date('2000-11-10') }
    ];

    const createdStudents = [];

    for (const sData of studentsData) {
      const firstInitial = sData.firstName.charAt(0).toUpperCase();
      const lastInitial = sData.lastName.charAt(0).toUpperCase();
      const tempPassword = `${firstInitial}${lastInitial}${sData.studentId}`;

      const student = await Student.create({
        studentId: sData.studentId,
        firstName: sData.firstName,
        lastName: sData.lastName,
        displayName: `${sData.firstName} ${sData.lastName}`,
        email: sData.email,
        gender: sData.gender,
        dateOfBirth: sData.dateOfBirth,
        academicLevelId: level1._id,
        classId: class1A._id,
        originalCohortId: cohort2024._id,
        currentCohortId: cohort2024._id,
        admissionYear: '2024',
        academicStatus: 'active',
        placementHistory: [{
          academicLevelId: level1._id,
          classId: class1A._id,
          cohortId: cohort2024._id,
          reason: 'INITIAL'
        }]
      });

      const user = await User.create({
        email: sData.email,
        password: tempPassword,
        role: 'student',
        studentId: sData.studentId,
        displayName: `${sData.firstName} ${sData.lastName}`,
        isActive: true,
        mustChangePassword: true,
        createdBy: registrationAdmin._id
      });

      student.userId = user._id;
      await student.save();

      createdStudents.push(student);
      console.log(`   ✅ ${student.displayName} (${student.studentId}) - pwd: ${tempPassword}`);
    }

    // ============================================================
    // 16. SAMPLE RESULTS
    // ============================================================
    console.log('\n📊 Creating Sample Results...');

    const alison = createdStudents[0];
    await Result.create([
      { studentId: alison._id, studentIdentifier: alison.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subAnatomy._id, componentType: 'SUBJECT', componentName: 'Anatomy', score: 48, maxScore: 60, percentage: 80, componentWeight: 30, contributionToModule: 24, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: alison._id, studentIdentifier: alison.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPhysiology._id, componentType: 'SUBJECT', componentName: 'Physiology', score: 45, maxScore: 60, percentage: 75, componentWeight: 30, contributionToModule: 22.5, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: alison._id, studentIdentifier: alison.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPathology._id, componentType: 'SUBJECT', componentName: 'Pathology', score: 51, maxScore: 60, percentage: 85, componentWeight: 40, contributionToModule: 34, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id }
    ]);

    const hana = createdStudents[1];
    await Result.create([
      { studentId: hana._id, studentIdentifier: hana.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subAnatomy._id, componentType: 'SUBJECT', componentName: 'Anatomy', score: 42, maxScore: 60, percentage: 70, componentWeight: 30, contributionToModule: 21, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: hana._id, studentIdentifier: hana.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPhysiology._id, componentType: 'SUBJECT', componentName: 'Physiology', score: 39, maxScore: 60, percentage: 65, componentWeight: 30, contributionToModule: 19.5, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: hana._id, studentIdentifier: hana.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPathology._id, componentType: 'SUBJECT', componentName: 'Pathology', score: 45, maxScore: 60, percentage: 75, componentWeight: 40, contributionToModule: 30, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id }
    ]);

    const daniel = createdStudents[2];
    await Result.create([
      { studentId: daniel._id, studentIdentifier: daniel.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subAnatomy._id, componentType: 'SUBJECT', componentName: 'Anatomy', score: 28, maxScore: 60, percentage: 46.67, componentWeight: 30, contributionToModule: 14, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: daniel._id, studentIdentifier: daniel.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPhysiology._id, componentType: 'SUBJECT', componentName: 'Physiology', score: 30, maxScore: 60, percentage: 50, componentWeight: 30, contributionToModule: 15, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id },
      { studentId: daniel._id, studentIdentifier: daniel.studentId, academicLevelId: level1._id, academicPeriodId: s1._id, moduleId: moduleBMS._id, cohortId: cohort2024._id, componentId: subPathology._id, componentType: 'SUBJECT', componentName: 'Pathology', score: 33, maxScore: 60, percentage: 55, componentWeight: 40, contributionToModule: 22, attemptType: 'ORIGINAL', attemptNumber: 1, uploadedBy: departmentAdmin._id, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id }
    ]);

    // ============================================================
    // 17. MODULE RESULTS
    // ============================================================
    console.log('\n📈 Creating Module Results...');
    await ModuleResult.create([
      { studentId: alison._id, studentIdentifier: alison.studentId, moduleId: moduleBMS._id, moduleName: moduleBMS.name, academicLevelId: level1._id, academicPeriodId: s1._id, cohortId: cohort2024._id, percentage: 80.5, grade: 'A-', gradePoint: 3.75, progressionStatus: 'PASS', attemptType: 'ORIGINAL', attemptNumber: 1, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id, calculatedBy: departmentAdmin._id },
      { studentId: hana._id, studentIdentifier: hana.studentId, moduleId: moduleBMS._id, moduleName: moduleBMS.name, academicLevelId: level1._id, academicPeriodId: s1._id, cohortId: cohort2024._id, percentage: 70.5, grade: 'B', gradePoint: 3.0, progressionStatus: 'PASS', attemptType: 'ORIGINAL', attemptNumber: 1, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id, calculatedBy: departmentAdmin._id },
      { studentId: daniel._id, studentIdentifier: daniel.studentId, moduleId: moduleBMS._id, moduleName: moduleBMS.name, academicLevelId: level1._id, academicPeriodId: s1._id, cohortId: cohort2024._id, percentage: 51, grade: 'D', gradePoint: 1.0, progressionStatus: 'RE_EXAM', attemptType: 'ORIGINAL', attemptNumber: 1, released: true, releasedAt: new Date(), releasedBy: departmentAdmin._id, calculatedBy: departmentAdmin._id }
    ]);
    console.log('   ✅ 3 ModuleResults created');

    // ============================================================
    // 18. SAMPLE AUDIT LOGS
    // ============================================================
    console.log('\n📋 Creating Sample Audit Logs...');
    await AuditLog.create([
      { actorId: superAdmin._id, actorRole: 'super_admin', actorEmail: superAdmin.email, action: 'SYSTEM_INITIALIZED', targetType: 'System', description: 'Database seeded' },
      { actorId: superAdmin._id, actorRole: 'super_admin', actorEmail: superAdmin.email, action: 'ADMIN_CREATED', targetType: 'User', targetId: itAdmin._id, metadata: { role: 'it_admin', email: itAdmin.email } },
      { actorId: itAdmin._id, actorRole: 'it_admin', actorEmail: itAdmin.email, action: 'ADMIN_CREATED', targetType: 'User', targetId: departmentAdmin._id, metadata: { role: 'department_admin', department: department.name } },
      { actorId: itAdmin._id, actorRole: 'it_admin', actorEmail: itAdmin.email, action: 'ADMIN_CREATED', targetType: 'User', targetId: registrationAdmin._id, metadata: { role: 'registration_admin', college: college.name } },
      { actorId: departmentAdmin._id, actorRole: 'department_admin', actorEmail: departmentAdmin.email, action: 'ADMIN_CREATED', targetType: 'User', targetId: classAdmin._id, metadata: { role: 'class_admin', class: class1A.name } }
    ]);
    console.log('   ✅ Sample audit logs created');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📝 ADMIN CREDENTIALS:');
    console.log('   Super Admin        | superadmin@university.edu | SuperAdmin123!');
    console.log('   IT Admin           | itadmin@university.edu    | ITAdmin123!');
    console.log('   Department Admin   | deptadmin@university.edu  | DeptAdmin123!');
    console.log('   Registration Admin | regadmin@university.edu   | RegAdmin123!');
    console.log('   Class Admin        | classadmin@university.edu | ClassAdmin123!');
    console.log('\n🎓 STUDENT CREDENTIALS:');
    console.log('   Alison Becker  | 1693/16 | alison.becker@university.edu | pwd: AB1693/16');
    console.log('   Hana Ahmed     | 1721/16 | hana.ahmed@university.edu    | pwd: HA1721/16');
    console.log('   Daniel Ali     | 1845/16 | daniel.ali@university.edu    | pwd: DA1845/16');
    console.log('\n🏫 ACADEMIC STRUCTURE:');
    console.log(`   College:   ${college.name} (${college.code})`);
    console.log(`   Department: ${department.name} (${department.code})`);
    console.log('   Levels:    Y1, Y2, Y3');
    console.log('   Cohorts:   COH-2024, COH-2025');
    console.log('   Classes:   Y1-A, Y1-B, Y2-A');
    console.log('   Periods:   Semester 1, Semester 2');
    console.log('\n📦 MODULES:');
    console.log('   BMS101 (SYSTEM_BASED):     Anatomy 30% | Physiology 30% | Pathology 40%');
    console.log('   PSK101 (ASSESSMENT_BASED): Midterm 20% | Assignment 10% | Final 70%');
    console.log('\n📊 SAMPLE RESULTS:');
    console.log('   Alison:  80.5% (A-)  → PASS');
    console.log('   Hana:    70.5% (B)   → PASS');
    console.log('   Daniel:  51% (D)     → RE_EXAM');
    console.log('\n' + '='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();