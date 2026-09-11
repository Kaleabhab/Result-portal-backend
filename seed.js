require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Student = require('./models/Student');
const College = require('./models/Academic/College');
const Department = require('./models/Academic/Department');
const AcademicLevel = require('./models/Academic/AcademicLevel');
const AcademicPeriod = require('./models/Academic/AcademicPeriod');
const Class = require('./models/Academic/Class');
const Cohort = require('./models/Academic/Cohort');
const Module = require('./models/Academic/Module');
const Subject = require('./models/Academic/Subject');
const AssessmentComponent = require('./models/Academic/AssessmentComponent');

// Result models
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
    // 1. CREATE ADMIN
    // ============================================================
    console.log('\n👤 Creating admin...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await User.create({
      email: 'admin@university.edu',
      password: adminPassword,
      role: 'admin',
      displayName: 'System Administrator',
      isActive: true,
      mustChangePassword: false
    });
    console.log('✅ Admin created: admin@university.edu / Admin123!');

    // ============================================================
    // 2. COLLEGE
    // ============================================================
    console.log('\n🏫 Creating college...');
    const college = await College.create({
      name: 'College of Health and Medical Sciences',
      code: 'CHMS',
      description: 'College of Health and Medical Sciences'
    });
    console.log(`✅ College created: ${college.name} (${college.code})`);

    // ============================================================
    // 3. DEPARTMENT
    // ============================================================
    console.log('\n🏢 Creating department...');
    const department = await Department.create({
      name: 'Medicine',
      code: 'MED',
      collegeId: college._id,
      departmentType: 'academic',
      academicModel: 'semester',
      gradingModel: 'GPA',
      progressionPolicy: 'moderate'
    });
    console.log(`✅ Department created: ${department.name} (${department.code})`);

    // ============================================================
    // 4. ACADEMIC LEVELS
    // ============================================================
    console.log('\n📚 Creating academic levels...');
    const level1 = await AcademicLevel.create({
      name: 'Year 1',
      code: 'Y1',
      departmentId: department._id,
      order: 1,
      description: 'First Year'
    });

    const level2 = await AcademicLevel.create({
      name: 'Year 2',
      code: 'Y2',
      departmentId: department._id,
      order: 2,
      description: 'Second Year'
    });

    const level3 = await AcademicLevel.create({
      name: 'Year 3',
      code: 'Y3',
      departmentId: department._id,
      order: 3,
      description: 'Third Year'
    });
    console.log('✅ Academic Levels created: Year 1, Year 2, Year 3');

    // ============================================================
    // 5. COHORTS
    // ============================================================
    console.log('\n🎓 Creating cohorts...');
    const cohort2024 = await Cohort.create({
      name: 'Cohort 2024',
      code: 'COH-2024',
      academicLevelId: level1._id,
      admissionYear: '2024',
      expectedGraduationYear: '2029',
      startDate: new Date('2024-09-01')
    });

    const cohort2025 = await Cohort.create({
      name: 'Cohort 2025',
      code: 'COH-2025',
      academicLevelId: level1._id,
      admissionYear: '2025',
      expectedGraduationYear: '2030',
      startDate: new Date('2025-09-01')
    });
    console.log('✅ Cohorts created: 2024, 2025');

    // ============================================================
    // 6. CLASSES
    // ============================================================
    console.log('\n👥 Creating classes...');
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
    console.log('✅ Classes created: Y1-A, Y1-B, Y2-A');

    // ============================================================
    // 7. ACADEMIC PERIODS
    // ============================================================
    console.log('\n📅 Creating academic periods...');
    const s1 = await AcademicPeriod.create({
      name: 'Semester 1',
      code: 'S1',
      academicLevelId: level1._id,
      order: 1,
      duration: 4,
      durationUnit: 'months',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-31')
    });

    const s2 = await AcademicPeriod.create({
      name: 'Semester 2',
      code: 'S2',
      academicLevelId: level1._id,
      order: 2,
      duration: 4,
      durationUnit: 'months',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-05-30')
    });
    console.log('✅ Academic Periods created: Semester 1, Semester 2');

    // ============================================================
    // 8. SYSTEM-BASED MODULE (with Subjects)
    // ============================================================
    console.log('\n📦 Creating system-based module...');
    const moduleBMS = await Module.create({
      name: 'Basic Medical Sciences',
      code: 'BMS101',
      academicPeriodId: s1._id,
      category: 'MAJOR',
      deliveryModel: 'SYSTEM_BASED',
      progressionCharacteristic: 'ONE_YEAR_LAG',
      progressionRule: 'pass_all',
      credit: 6,
      order: 1,
      description: 'Foundational medical sciences'
    });

    const subAnatomy = await Subject.create({
      name: 'Anatomy',
      code: 'ANA101',
      moduleId: moduleBMS._id,
      weight: 30,
      order: 1
    });

    const subPhysiology = await Subject.create({
      name: 'Physiology',
      code: 'PHY101',
      moduleId: moduleBMS._id,
      weight: 30,
      order: 2
    });

    const subPathology = await Subject.create({
      name: 'Pathology',
      code: 'PAT101',
      moduleId: moduleBMS._id,
      weight: 40,
      order: 3
    });
    console.log('✅ System-Based Module created: BMS101');
    console.log('   - Anatomy (30%), Physiology (30%), Pathology (40%)');

    // ============================================================
    // 9. ASSESSMENT-BASED MODULE (with AssessmentComponents)
    // ============================================================
    console.log('\n📝 Creating assessment-based module...');
    const moduleProfSkills = await Module.create({
      name: 'Professional Skills',
      code: 'PSK101',
      academicPeriodId: s1._id,
      category: 'MINOR',
      deliveryModel: 'ASSESSMENT_BASED',
      progressionCharacteristic: 'NO_LAG',
      progressionRule: 'weighted_average',
      credit: 3,
      order: 2,
      description: 'Professional communication and skills'
    });

    const acMidterm = await AssessmentComponent.create({
      name: 'Midterm Exam',
      code: 'PSK-MID',
      moduleId: moduleProfSkills._id,
      componentType: 'MIDTERM',
      weight: 20,
      maxScore: 100,
      order: 1
    });

    const acAssignment = await AssessmentComponent.create({
      name: 'Assignment',
      code: 'PSK-ASN',
      moduleId: moduleProfSkills._id,
      componentType: 'ASSIGNMENT',
      weight: 10,
      maxScore: 100,
      order: 2
    });

    const acFinal = await AssessmentComponent.create({
      name: 'Final Exam',
      code: 'PSK-FIN',
      moduleId: moduleProfSkills._id,
      componentType: 'FINAL_EXAM',
      weight: 70,
      maxScore: 100,
      order: 3
    });
    console.log('✅ Assessment-Based Module created: PSK101');
    console.log('   - Midterm (20%), Assignment (10%), Final Exam (70%)');

    // ============================================================
    // 10. REGISTER SAMPLE STUDENTS
    // ============================================================
    console.log('\n🎓 Creating sample students...');

    const studentsData = [
      {
        studentId: '1693/16',
        firstName: 'Alison',
        lastName: 'Becker',
        email: 'alison.becker@university.edu',
        gender: 'female',
        dateOfBirth: new Date('2000-01-15')
      },
      {
        studentId: '1721/16',
        firstName: 'Hana',
        lastName: 'Ahmed',
        email: 'hana.ahmed@university.edu',
        gender: 'female',
        dateOfBirth: new Date('2001-03-22')
      },
      {
        studentId: '1845/16',
        firstName: 'Daniel',
        lastName: 'Ali',
        email: 'daniel.ali@university.edu',
        gender: 'male',
        dateOfBirth: new Date('2000-11-10')
      }
    ];

    const createdStudents = [];

    for (const sData of studentsData) {
      // Generate temporary password
      const firstInitial = sData.firstName.charAt(0).toUpperCase();
      const lastInitial = sData.lastName.charAt(0).toUpperCase();
      const tempPassword = `${firstInitial}${lastInitial}${sData.studentId}`;

      // Create Student
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

      // Create User
      const user = await User.create({
        email: sData.email,
        password: tempPassword,
        role: 'student',
        studentId: sData.studentId,
        displayName: `${sData.firstName} ${sData.lastName}`,
        isActive: true,
        mustChangePassword: true
      });

      // Link
      student.userId = user._id;
      await student.save();

      createdStudents.push(student);
      console.log(`   ✅ ${student.displayName} (${student.studentId}) - pwd: ${tempPassword}`);
    }

    // ============================================================
    // 11. CREATE SAMPLE RESULTS
    // ============================================================
    console.log('\n📊 Creating sample results...');

    // Alison: high performer
    // Anatomy 48/60 (80%), Physiology 45/60 (75%), Pathology 51/60 (85%)
    const alison = createdStudents[0];
    await Result.create([
      {
        studentId: alison._id,
        studentIdentifier: alison.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subAnatomy._id,
        componentType: 'SUBJECT',
        componentName: 'Anatomy',
        score: 48,
        maxScore: 60,
        percentage: 80,
        componentWeight: 30,
        contributionToModule: 24,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: alison._id,
        studentIdentifier: alison.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPhysiology._id,
        componentType: 'SUBJECT',
        componentName: 'Physiology',
        score: 45,
        maxScore: 60,
        percentage: 75,
        componentWeight: 30,
        contributionToModule: 22.5,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: alison._id,
        studentIdentifier: alison.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPathology._id,
        componentType: 'SUBJECT',
        componentName: 'Pathology',
        score: 51,
        maxScore: 60,
        percentage: 85,
        componentWeight: 40,
        contributionToModule: 34,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      }
    ]);
    console.log('   ✅ Alison: 80.5% (A-)');

    // Hana: average performer
    // Anatomy 42/60 (70%), Physiology 39/60 (65%), Pathology 45/60 (75%)
    const hana = createdStudents[1];
    await Result.create([
      {
        studentId: hana._id,
        studentIdentifier: hana.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subAnatomy._id,
        componentType: 'SUBJECT',
        componentName: 'Anatomy',
        score: 42,
        maxScore: 60,
        percentage: 70,
        componentWeight: 30,
        contributionToModule: 21,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: hana._id,
        studentIdentifier: hana.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPhysiology._id,
        componentType: 'SUBJECT',
        componentName: 'Physiology',
        score: 39,
        maxScore: 60,
        percentage: 65,
        componentWeight: 30,
        contributionToModule: 19.5,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: hana._id,
        studentIdentifier: hana.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPathology._id,
        componentType: 'SUBJECT',
        componentName: 'Pathology',
        score: 45,
        maxScore: 60,
        percentage: 75,
        componentWeight: 40,
        contributionToModule: 30,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      }
    ]);
    console.log('   ✅ Hana: 70.5% (B)');

    // Daniel: failing performer (D grade)
    // Anatomy 28/60 (46.67%), Physiology 30/60 (50%), Pathology 33/60 (55%)
    const daniel = createdStudents[2];
    await Result.create([
      {
        studentId: daniel._id,
        studentIdentifier: daniel.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subAnatomy._id,
        componentType: 'SUBJECT',
        componentName: 'Anatomy',
        score: 28,
        maxScore: 60,
        percentage: 46.67,
        componentWeight: 30,
        contributionToModule: 14,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: daniel._id,
        studentIdentifier: daniel.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPhysiology._id,
        componentType: 'SUBJECT',
        componentName: 'Physiology',
        score: 30,
        maxScore: 60,
        percentage: 50,
        componentWeight: 30,
        contributionToModule: 15,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      },
      {
        studentId: daniel._id,
        studentIdentifier: daniel.studentId,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        moduleId: moduleBMS._id,
        cohortId: cohort2024._id,
        componentId: subPathology._id,
        componentType: 'SUBJECT',
        componentName: 'Pathology',
        score: 33,
        maxScore: 60,
        percentage: 55,
        componentWeight: 40,
        contributionToModule: 22,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        uploadedBy: admin._id,
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id
      }
    ]);
    console.log('   ✅ Daniel: 51% (D)');

    // ============================================================
    // 12. CREATE MODULE RESULTS (calculated)
    // ============================================================
    console.log('\n📈 Creating module results...');

    await ModuleResult.create([
      {
        studentId: alison._id,
        studentIdentifier: alison.studentId,
        moduleId: moduleBMS._id,
        moduleName: moduleBMS.name,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        cohortId: cohort2024._id,
        percentage: 80.5,
        grade: 'A-',
        gradePoint: 3.75,
        progressionStatus: 'PASS',
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        componentSnapshot: [
          { componentName: 'Anatomy', score: 48, maxScore: 60, percentage: 80, weight: 30, contribution: 24 },
          { componentName: 'Physiology', score: 45, maxScore: 60, percentage: 75, weight: 30, contribution: 22.5 },
          { componentName: 'Pathology', score: 51, maxScore: 60, percentage: 85, weight: 40, contribution: 34 }
        ],
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id,
        calculatedBy: admin._id
      },
      {
        studentId: hana._id,
        studentIdentifier: hana.studentId,
        moduleId: moduleBMS._id,
        moduleName: moduleBMS.name,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        cohortId: cohort2024._id,
        percentage: 70.5,
        grade: 'B',
        gradePoint: 3.0,
        progressionStatus: 'PASS',
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        componentSnapshot: [
          { componentName: 'Anatomy', score: 42, maxScore: 60, percentage: 70, weight: 30, contribution: 21 },
          { componentName: 'Physiology', score: 39, maxScore: 60, percentage: 65, weight: 30, contribution: 19.5 },
          { componentName: 'Pathology', score: 45, maxScore: 60, percentage: 75, weight: 40, contribution: 30 }
        ],
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id,
        calculatedBy: admin._id
      },
      {
        studentId: daniel._id,
        studentIdentifier: daniel.studentId,
        moduleId: moduleBMS._id,
        moduleName: moduleBMS.name,
        academicLevelId: level1._id,
        academicPeriodId: s1._id,
        cohortId: cohort2024._id,
        percentage: 51,
        grade: 'D',
        gradePoint: 1.0,
        progressionStatus: 'RE_EXAM',
        progressionReason: 'Grade D → Re-examination required (moderate policy)',
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        componentSnapshot: [
          { componentName: 'Anatomy', score: 28, maxScore: 60, percentage: 46.67, weight: 30, contribution: 14 },
          { componentName: 'Physiology', score: 30, maxScore: 60, percentage: 50, weight: 30, contribution: 15 },
          { componentName: 'Pathology', score: 33, maxScore: 60, percentage: 55, weight: 40, contribution: 22 }
        ],
        released: true,
        releasedAt: new Date(),
        releasedBy: admin._id,
        calculatedBy: admin._id
      }
    ]);
    console.log('   ✅ 3 ModuleResults created');

    // ============================================================
    // 13. CREATE SAMPLE PROGRESSION RECORD
    // ============================================================
    console.log('\n⚠️  Creating sample progression record...');

    await ProgressionRecord.create({
      studentId: daniel._id,
      studentIdentifier: daniel.studentId,
      fromAcademicLevelId: level1._id,
      targetAcademicLevelId: level1._id,
      originalCohortId: cohort2024._id,
      targetCohortId: cohort2025._id,
      moduleId: moduleBMS._id,
      outcome: 'RE_EXAM',
      lagType: 'NONE',
      reason: 'Daniel scored D (51%) in BMS101. Moderate policy requires re-examination.',
      status: 'PENDING',
      determinedBy: admin._id,
      determinedAt: new Date()
    });
    console.log('   ✅ Progression record created for Daniel');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 ADMIN CREDENTIALS:');
    console.log('   Email:    admin@university.edu');
    console.log('   Password: Admin123!');
    console.log('\n🎓 STUDENT CREDENTIALS:');
    console.log('   Alison Becker  | 1693/16 | alison.becker@university.edu | pwd: AB1693/16');
    console.log('   Hana Ahmed     | 1721/16 | hana.ahmed@university.edu    | pwd: HA1721/16');
    console.log('   Daniel Ali     | 1845/16 | daniel.ali@university.edu    | pwd: DA1845/16');
    console.log('\n🏫 ACADEMIC STRUCTURE:');
    console.log(`   College:   ${college.name} (${college.code})`);
    console.log(`   Department: ${department.name} (${department.code})`);
    console.log('   Academic Levels: Year 1, Year 2, Year 3');
    console.log('   Cohorts:   Cohort 2024, Cohort 2025');
    console.log('   Classes:   Y1-A, Y1-B, Y2-A');
    console.log('   Academic Periods: Semester 1, Semester 2');
    console.log('\n📦 MODULES:');
    console.log('   BMS101 (SYSTEM_BASED):  Anatomy 30% | Physiology 30% | Pathology 40%');
    console.log('   PSK101 (ASSESSMENT_BASED): Midterm 20% | Assignment 10% | Final 70%');
    console.log('\n📊 SAMPLE RESULTS:');
    console.log('   Alison:  80.5% (A-)  → PASS');
    console.log('   Hana:    70.5% (B)   → PASS');
    console.log('   Daniel:  51% (D)     → RE_EXAM');
    console.log('\n' + '='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();