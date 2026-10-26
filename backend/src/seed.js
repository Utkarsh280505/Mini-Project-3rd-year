const bcrypt = require('bcryptjs');
const prisma = require('./config/db');

async function seed() {
  console.log('Seeding NeuroEarly AI Database...');

  // Clear existing records
  await prisma.riskReport.deleteMany();
  await prisma.modalityData.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.careAssignment.deleteMany();
  await prisma.organizationPatient.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Clinician
  const clinician = await prisma.user.create({
    data: {
      email: 'doctor@neuroearly.ai',
      passwordHash,
      name: 'Dr. Ananya Sharma, MD',
      role: 'CLINICIAN'
    }
  });

  // 2. Create Patient 1: John Doe (Moderate/At-Risk)
  const patient1User = await prisma.user.create({
    data: {
      email: 'patient@neuroearly.ai',
      passwordHash,
      name: 'Rajesh Verma',
      role: 'PATIENT',
      patient: {
        create: {
          age: 68,
          gender: 'Male',
          baselineMMSE: 24.5,
          medicalHistory: 'Mild memory lapses reported over past 6 months, family history of AD.'
        }
      }
    },
    include: { patient: true }
  });

  // 3. Create Patient 2: Healthy Control
  const patient2User = await prisma.user.create({
    data: {
      email: 'healthy@neuroearly.ai',
      passwordHash,
      name: 'Sunita Patel',
      role: 'PATIENT',
      patient: {
        create: {
          age: 62,
          gender: 'Female',
          baselineMMSE: 29.5,
          medicalHistory: 'Routine checkup, no cognitive concerns.'
        }
      }
    },
    include: { patient: true }
  });

  await prisma.organization.create({
    data: {
      name: 'NeuroEarly Demo Clinic',
      memberships: {
        create: {
          userId: clinician.id,
          role: 'CLINICIAN'
        }
      },
      patients: {
        create: [
          { patientProfileId: patient1User.patient.id },
          { patientProfileId: patient2User.patient.id }
        ]
      },
      assignments: {
        create: [
          {
            patientProfileId: patient1User.patient.id,
            clinicianUserId: clinician.id,
            grantedByUserId: clinician.id
          },
          {
            patientProfileId: patient2User.patient.id,
            clinicianUserId: clinician.id,
            grantedByUserId: clinician.id
          }
        ]
      }
    }
  });

  // Create past session for Rajesh (Longitudinal tracking)
  const pastSession = await prisma.assessmentSession.create({
    data: {
      patientId: patient1User.patient.id,
      clinicianId: clinician.id,
      status: 'COMPLETED',
      notes: 'Initial screening session 3 months ago. Mild pitch variability noticed.',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.riskReport.create({
    data: {
      sessionId: pastSession.id,
      fusedRiskScore: 0.38,
      confidenceIntervalLow: 0.34,
      confidenceIntervalHigh: 0.42,
      riskBand: 'moderate risk',
      mmseEstimate: 26.2,
      modalityScoresJson: JSON.stringify({ imaging: 0.35, speech: 0.42, motor: 0.28, cognitive: 0.45 }),
      topContributingFeaturesJson: JSON.stringify([
        { feature: 'cognitive.mmse_score', contribution: 0.35, importance: 0.947 },
        { feature: 'speech.pause_ratio', contribution: 0.28, importance: 0.812 }
      ]),
      clinicianNotes: 'Monitored. Recommended 3-month follow up.',
      reviewedBy: clinician.name,
      reviewedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000)
    }
  });

  // Create current active session for Rajesh
  const activeSession = await prisma.assessmentSession.create({
    data: {
      patientId: patient1User.patient.id,
      clinicianId: clinician.id,
      status: 'UNDER_REVIEW',
      notes: 'Follow-up assessment. Multi-modal risk engine executed.',
    }
  });

  await prisma.modalityData.createMany({
    data: [
      {
        sessionId: activeSession.id,
        modalityType: 'speech',
        rawDataJson: JSON.stringify({ jitter: 0.948, shimmer: 0.88, pause_ratio: 0.45, pitch_var: 1.2, speech_rate: 2.1 }),
        featureVectorJson: JSON.stringify({ jitter: 0.948, shimmer: 0.88, pause_ratio: 0.45, pitch_var: 1.2, speech_rate: 2.1 }),
        riskScore: 0.89
      },
      {
        sessionId: activeSession.id,
        modalityType: 'motor',
        rawDataJson: JSON.stringify({ stride_var: 0.285, tremor_amp: 0.65, reaction_time_ms: 480, gait_speed: 0.82 }),
        featureVectorJson: JSON.stringify({ stride_var: 0.285, tremor_amp: 0.65, reaction_time_ms: 480, gait_speed: 0.82 }),
        riskScore: 0.84
      },
      {
        sessionId: activeSession.id,
        modalityType: 'cognitive',
        rawDataJson: JSON.stringify({ mmse_score: 24.4, moca_score: 21.0, recall_score: 4.5, attention_score: 5.0 }),
        featureVectorJson: JSON.stringify({ mmse_score: 24.4, moca_score: 21.0, recall_score: 4.5, attention_score: 5.0 }),
        riskScore: 0.92
      }
    ]
  });

  await prisma.riskReport.create({
    data: {
      sessionId: activeSession.id,
      fusedRiskScore: 0.912,
      confidenceIntervalLow: 0.895,
      confidenceIntervalHigh: 0.928,
      riskBand: 'elevated risk - recommend specialist evaluation',
      mmseEstimate: 24.4,
      modalityScoresJson: JSON.stringify({ imaging: 0.88, speech: 0.89, motor: 0.84, cognitive: 0.92 }),
      topContributingFeaturesJson: JSON.stringify([
        { feature: 'cognitive.mmse_score', contribution: 0.42, importance: 0.947 },
        { feature: 'speech.jitter', contribution: 0.38, importance: 0.910 },
        { feature: 'motor.stride_var', contribution: 0.31, importance: 0.710 },
        { feature: 'imaging.hippocampus_atrophy', contribution: 0.29, importance: 0.850 }
      ]),
      clinicianNotes: 'Awaiting doctor sign-off. High priority for neuro imaging review.'
    }
  });

  console.log('Seeding complete! Logins:');
  console.log(' - Clinician: doctor@neuroearly.ai / password123');
  console.log(' - Patient 1: patient@neuroearly.ai / password123');
  console.log(' - Patient 2: healthy@neuroearly.ai / password123');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
