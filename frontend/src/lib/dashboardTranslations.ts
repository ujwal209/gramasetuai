import { LanguageType } from '@/components/LanguageDropdown';

export interface DashboardTranslationSchema {
  sidebar: {
    overview: string;
    schemes: string;
    nitirag: string;
    vanibot: string;
    kagazcheck: string;
    parchaa: string;
    farmMap: string;
    applications: string;
    chaupal: string;
    csc: string;
    notifications: string;
    profile: string;
    logout: string;
    language: string;
    liveDossier: string;
    verifiedCitizen: string;
  };
  overview: {
    welcomeGreeting: string;
    welcomeSub: string;
    editProfileBanner: string;
    kpiSchemes: string;
    kpiSchemesSub: string;
    kpiDbt: string;
    kpiDbtSub: string;
    kpiLand: string;
    kpiLandSub: string;
    kpiDocs: string;
    kpiDocsSub: string;
    sectionModules: string;
    sectionModulesSub: string;
    launchModule: string;
  };
  profile: {
    title: string;
    subtitle: string;
    editProfileBtn: string;
    personalTitle: string;
    personalDesc: string;
    dbtTitle: string;
    dbtDesc: string;
    landTitle: string;
    landDesc: string;
    cropsTitle: string;
    cropsDesc: string;
    mapTitle: string;
    mapDesc: string;
    mediaTitle: string;
    mediaDesc: string;
    noLandPhotos: string;
    noDocPhotos: string;
    dbtActive: string;
    dbtPending: string;
  };
  editProfile: {
    title: string;
    subtitle: string;
    backBtn: string;
    saveBtn: string;
    cancelBtn: string;
    saving: string;
    successMessage: string;
  };
  vani: {
    title: string;
    subtitle: string;
    liveTab: string;
    archivesTab: string;
    dialect: string;
    tapToSpeak: string;
    listening: string;
    transcribing: string;
    synthesizing: string;
    readyStatus: string;
    typePlaceholder: string;
    askBtn: string;
    suggestedLabel: string;
    citizenSpokenQuery: string;
    gazetteGuidance: string;
    aiExecutiveSummary: string;
    verifiedSources: string;
    identifiedSchemes: string;
    applyParchaa: string;
    details: string;
    replayVoice: string;
    pauseVoice: string;
    savedToDb: string;
    noArchivesTitle: string;
    noArchivesSub: string;
    startVoiceCall: string;
    searchArchivesPlaceholder: string;
    allLanguages: string;
    deleteArchive: string;
    backToArchives: string;
    downloadMp3: string;
    nextStepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    minimizeSummary: string;
    expandSummary: string;
    filterTime: string;
    timeAll: string;
    timeToday: string;
    timeWeek: string;
    timeMonth: string;
    sortNewest: string;
    sortOldest: string;
    sortDuration: string;
    clearAllArchives: string;
    matchingResults: string;
  };
}

export const dashboardTranslations: Record<LanguageType, DashboardTranslationSchema> = {
  // 1. ENGLISH
  en: {
    sidebar: {
      overview: 'Overview Hub',
      schemes: 'Scheme Discovery',
      nitirag: 'Niti RAG Advisory',
      vanibot: 'Vani Voice Assistant',
      kagazcheck: 'Document Auditor',
      parchaa: 'Application Dossier',
      farmMap: 'Cadastral Farm GIS',
      applications: 'Application Tracker',
      chaupal: 'Kisan Chaupal',
      csc: 'CSC Assisted Mode',
      notifications: 'WhatsApp & SMS Alerts',
      profile: 'Farmer Profile Dossier',
      logout: 'Sign Out',
      language: 'Language',
      liveDossier: 'Live Dossier',
      verifiedCitizen: 'Verified Citizen',
    },
    overview: {
      welcomeGreeting: 'Welcome back,',
      welcomeSub: 'Your unified civic hub for agricultural schemes, cadastral land GIS, and statutory welfare.',
      editProfileBanner: 'View Full Profile & Land Records →',
      kpiSchemes: 'Qualified Schemes',
      kpiSchemesSub: 'Deterministic Match',
      kpiDbt: 'DBT Bank Linkage',
      kpiDbtSub: 'Aadhaar Seeded',
      kpiLand: 'Landholding',
      kpiLandSub: 'Cadastral Area',
      kpiDocs: 'Document Vault',
      kpiDocsSub: 'Audit Ready',
      sectionModules: 'Core Agricultural Modules & Services',
      sectionModulesSub: 'Access verified government workflows with zero middlemen.',
      launchModule: 'Open Module →',
    },
    profile: {
      title: 'Farmer Citizen Profile & Land Dossier',
      subtitle: 'Complete verified record of your citizen demographics, landholding cadastre, cropping patterns, and welfare eligibility.',
      editProfileBtn: 'Edit Profile & Records',
      personalTitle: '1. Citizen Identity & Welfare Inclusions',
      personalDesc: 'Demographics, contact info, social category, and household income.',
      dbtTitle: '2. Statutory Welfare & DBT Linkage Status',
      dbtDesc: 'Direct Bank Transfer seeding and central welfare registrations.',
      landTitle: '3. Landholding, Soil & Water Infrastructure',
      landDesc: 'Cadastral survey numbers, acreage, soil classification, and irrigation setup.',
      cropsTitle: '4. Cropping Patterns, Machinery & Livestock Assets',
      cropsDesc: 'Kharif/Rabi crops grown, farm equipment owned, and dairy assets.',
      mapTitle: '5. Cadastral Farm Geolocation & Verified Address',
      mapDesc: 'Interactive pinpoint GPS location and administrative address hierarchy.',
      mediaTitle: '6. Land Photos & Document Vault',
      mediaDesc: 'Uploaded field snapshots and land record documents (Pahani / RTC / 7-12).',
      noLandPhotos: 'No land photos uploaded yet.',
      noDocPhotos: 'No land documents uploaded yet.',
      dbtActive: 'VERIFIED ACTIVE',
      dbtPending: 'NOT SEEDED',
    },
    editProfile: {
      title: 'Edit Farmer Profile & Land Details',
      subtitle: 'Update any parameter of your citizen profile, landholding, cropping system, or cadastral coordinates.',
      backBtn: '← Back to Profile',
      saveBtn: 'Save Changes to Database',
      cancelBtn: 'Cancel',
      saving: 'Saving Changes...',
      successMessage: 'Profile updated successfully! Redirecting to dossier...',
    },
    vani: {
      title: 'Vani-Bot Multilingual Civic Voice AI',
      subtitle: 'Speak naturally in Kannada, Hindi, Telugu, Tamil, Marathi, or English to inquire regarding agricultural subsidies, soil cards, and government benefits.',
      liveTab: 'Live Voice Assistant',
      archivesTab: 'Voice Call Archives & AI Summaries',
      dialect: 'DIALECT:',
      tapToSpeak: 'Tap to Speak Regional Voice Query',
      listening: 'Listening... Speak clearly • Tap to finish',
      transcribing: 'Transcribing speech audio...',
      synthesizing: 'Searching National Gazette & Synthesizing AI Response...',
      readyStatus: 'READY',
      typePlaceholder: 'Or type your query (e.g. PM-KISAN, Drip Irrigation Subsidy, Solar Pump)...',
      askBtn: 'Ask AI →',
      suggestedLabel: 'SUGGESTED:',
      citizenSpokenQuery: 'Citizen Spoken Query',
      gazetteGuidance: 'Statutory Gazette Guidance',
      aiExecutiveSummary: 'AI Executive Summary & Statutory Findings',
      verifiedSources: 'Official Government Gazette Sources & Citations',
      identifiedSchemes: 'Identified Government Welfare Programs',
      applyParchaa: 'Apply on Parchaa →',
      details: 'Details',
      replayVoice: 'Replay Voice',
      pauseVoice: 'Pause Voice',
      savedToDb: 'Saved to Database Archives',
      noArchivesTitle: 'No Voice Conversations Recorded',
      noArchivesSub: 'You have not made any voice queries yet. Start speaking with Vani to generate AI summaries and audio archives.',
      startVoiceCall: 'Start Voice Conversation →',
      searchArchivesPlaceholder: 'Search transcripts, crops, subsidies, or summary keywords...',
      allLanguages: 'All Languages',
      deleteArchive: 'Delete Archive',
      backToArchives: '← Back to Call Archives',
      downloadMp3: 'Download MP3',
      nextStepsTitle: 'Recommended Citizen Next Steps',
      step1: 'Generate your compiled Parchaa Single-Page Application with verified QR stamp.',
      step2: 'Check KagazCheck Document Auditor to ensure Survey No RTC / 7-12 record is valid.',
      step3: 'Visit your local CSC Center or Gram Panchayat for final biometric submission.',
      minimizeSummary: 'Minimize Summary',
      expandSummary: 'Show Full AI Summary',
      filterTime: 'Time Range:',
      timeAll: 'All Time',
      timeToday: 'Today',
      timeWeek: 'This Week',
      timeMonth: 'This Month',
      sortNewest: 'Newest First',
      sortOldest: 'Oldest First',
      sortDuration: 'Longest Duration',
      clearAllArchives: 'Clear All Archives',
      matchingResults: 'Matching Archives',
    },
  },

  // 2. KANNADA
  kn: {
    sidebar: {
      overview: 'ಅವಲೋಕನ ಕೇಂದ್ರ',
      schemes: 'ಯೋಜನೆಗಳ ಅನ್ವೇಷಣೆ',
      nitirag: 'ನೀತಿ RAG ಸಲಹೆಗಾರ',
      vanibot: 'ವಾಣಿ ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್',
      kagazcheck: 'ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ',
      parchaa: 'ಅರ್ಜಿ ಪರ್ಚಾ',
      farmMap: 'ಕೃಷಿ ನಕಾಶೆ GIS',
      applications: 'ಅರ್ಜಿಗಳ ಸ್ಥಿತಿ',
      chaupal: 'ಕಿಸಾನ್ ಚೌಪಾಲ್',
      csc: 'ಗ್ರಾಮ ಒನ್ / CSC ಮೋಡ್',
      notifications: 'ವಾಟ್ಸಾಪ್ & SMS ಎಚ್ಚರಿಕೆ',
      profile: 'ರೈತರ ಪ್ರೊಫೈಲ್ ದಾಖಲೆ',
      logout: 'ಲಾಗ್ ಔಟ್',
      language: 'ಭಾಷೆ',
      liveDossier: 'ನೇರ ದಾಖಲೆ',
      verifiedCitizen: 'ದೃಢೀಕೃತ ರೈತ',
    },
    overview: {
      welcomeGreeting: 'ಮತ್ತೆ ಸ್ವಾಗತ,',
      welcomeSub: 'ಕೃಷಿ ಯೋಜನೆಗಳು, ಭೂ ಕಂದಾಯ ನಕಾಶೆ ಮತ್ತು ಸರ್ಕಾರದ ಸಹಾಯಧನಗಳ ನಿಮ್ಮ ಅಧಿಕೃತ ವೇದಿಕೆ.',
      editProfileBanner: 'ಸಂಪೂರ್ಣ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಭೂಮಿ ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ →',
      kpiSchemes: 'ಅರ್ಹ ಯೋಜನೆಗಳು',
      kpiSchemesSub: 'ನೇರ ಹೊಂದಾಣಿಕೆ',
      kpiDbt: 'DBT ಬ್ಯಾಂಕ್ ಲಿಂಕ್',
      kpiDbtSub: 'ಆಧಾರ್ ಜೋಡಣೆ',
      kpiLand: 'ಭೂಮಿ ವಿಸ್ತೀರ್ಣ',
      kpiLandSub: 'ಪಹಣಿ ವಿಸ್ತೀರ್ಣ',
      kpiDocs: 'ದಾಖಲೆಗಳ ಕೋಶ',
      kpiDocsSub: 'ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ',
      sectionModules: 'ಪ್ರಮುಖ ಕೃಷಿ ಸೇವೆಗಳು ಮತ್ತು ಮಾಡ್ಯೂಲ್‌ಗಳು',
      sectionModulesSub: 'ಯಾವುದೇ ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ಸರ್ಕಾರದ ಯೋಜನೆಗಳನ್ನು ನೇರವಾಗಿ ಪಡೆಯಿರಿ.',
      launchModule: 'ಸೇವೆಗೆ ಪ್ರವೇಶಿಸಿ →',
    },
    profile: {
      title: 'ರೈತ ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಭೂಮಿ ದಾಖಲೆಗಳು',
      subtitle: 'ನಿಮ್ಮ ವಿವರಗಳು, ಪಹಣಿ/RTC ದಾಖಲೆ, ಬೆಳೆಗಳ ಮಾಹಿತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಅರ್ಹತೆಯ ಅಧಿಕೃತ ದಾಖಲೆ.',
      editProfileBtn: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ',
      personalTitle: '1. ನಾಗರಿಕ ಗುರುತು ಮತ್ತು ಸಾಮಾಜಿಕ ವರ್ಗ',
      personalDesc: 'ಹೆಸರು, ಮೊಬೈಲ್, ವಯಸ್ಸು, ಸಾಮಾಜಿಕ ವರ್ಗ ಮತ್ತು ಕುಟುಂಬದ ಆದಾಯ.',
      dbtTitle: '2. ಶಾಸನಬದ್ಧ ಯೋಜನೆಗಳು ಮತ್ತು DBT ಬ್ಯಾಂಕ್ ಸ್ಥಿತಿ',
      dbtDesc: 'ನೇರ ಹಣ ವರ್ಗಾವಣೆ ಜೋಡಣೆ ಮತ್ತು ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳು.',
      landTitle: '3. ಭೂಮಿ, ಮಣ್ಣು ಮತ್ತು ನೀರಾವರಿ ಮೂಲಗಳು',
      landDesc: 'ಸರ್ವೆ ನಂಬರ್, ಎಕರೆ, ಮಣ್ಣಿನ ಪ್ರಕಾರ ಮತ್ತು ನೀರಾವರಿ ಸೌಲಭ್ಯ.',
      cropsTitle: '4. ಬೆಳೆ ಪದ್ಧತಿ, ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಮತ್ತು ಹೈನುಗಾರಿಕೆ',
      cropsDesc: 'ಮುಂಗಾರು/ಹಿಂಗಾರು ಬೆಳೆಗಳು, ಟ್ರ್ಯಾಕ್ಟರ್ ಉಪಕರಣಗಳು ಮತ್ತು ಜಾನುವಾರು.',
      mapTitle: '5. ಜಮೀನಿನ GIS ನಕಾಶೆ ಮತ್ತು ಅಧಿಕೃತ ವಿಳಾಸ',
      mapDesc: 'ನಕಾಶೆಯಲ್ಲಿ ಗುರುತಿಸಲಾದ ಜಮೀನಿನ ನಿಖರ ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ.',
      mediaTitle: '6. ಜಮೀನಿನ ಛಾಯಾಚಿತ್ರಗಳು ಮತ್ತು ಪಹಣಿ ದಾಖಲೆಗಳು',
      mediaDesc: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾದ ಜಮೀನಿನ ಫೋಟೋಗಳು ಮತ್ತು RTC / 7-12 ದಾಖಲೆಗಳು.',
      noLandPhotos: 'ಯಾವುದೇ ಜಮೀನಿನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿಲ್ಲ.',
      noDocPhotos: 'ಯಾವುದೇ ಪಹಣಿ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿಲ್ಲ.',
      dbtActive: 'ದೃಢೀಕೃತ ಸಕ್ರಿಯ',
      dbtPending: 'ಜೋಡಣೆಯಾಗಿಲ್ಲ',
    },
    editProfile: {
      title: 'ರೈತರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಜಮೀನಿನ ವಿವರಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ',
      subtitle: 'ನಿಮ್ಮ ವಿವರಗಳು, ಜಮೀನು, ಬೆಳೆಗಳು ಅಥವಾ ನಕಾಶೆಯ ಮಾಹಿತಿಯನ್ನು ನವೀಕರಿಸಿ.',
      backBtn: '← ಪ್ರೊಫೈಲ್‌ಗೆ ಹಿಂತಿರುಗಿ',
      saveBtn: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
      cancelBtn: 'ರದ್ದುಮಾಡಿ',
      saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
      successMessage: 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ದಾಖಲೆಗೆ ಹಿಂತಿರುಗಲಾಗುತ್ತಿದೆ...',
    },
    vani: {
      title: 'ವಾಣಿ-ಬಾಟ್ ಬಹುಭಾಷಾ ಕೃಷಿ ವಾಯ್ಸ್ ಎಐ',
      subtitle: 'ಕನ್ನಡ, ಹಿಂದಿ, ತೆಲುಗು, ತಮಿಳು, ಮರಾಠಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೃಷಿ ಸಬ್ಸಿಡಿಗಳು, ಮಣ್ಣಿನ ಕಾರ್ಡ್ ಮತ್ತು ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಮಾತನಾಡಿ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.',
      liveTab: 'ಲೈವ್ ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್',
      archivesTab: 'ಕರೆ ಇತಿಹಾಸ ಮತ್ತು ಎಐ ಸಾರಾಂಶ',
      dialect: 'ಭಾಷೆ:',
      tapToSpeak: 'ಪ್ರಶ್ನೆ ಕೇಳಲು ಇಲ್ಲಿ ಒತ್ತಿ ಮಾತನಾಡಿ',
      listening: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ • ಮುಗಿಸಲು ಒತ್ತಿ',
      transcribing: 'ಧ್ವನಿ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ...',
      synthesizing: 'ಸರ್ಕಾರಿ ಗೆಜೆಟ್ ನಿಯಮಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
      readyStatus: 'ಸಿದ್ಧವಾಗಿದೆ',
      typePlaceholder: 'ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಬರೆಯಿರಿ (ಉದಾ: ಪಿಎಂ-ಕಿಸಾನ್, ಹನಿ ನೀರಾವರಿ ಸಬ್ಸಿಡಿ, ಸೋಲಾರ್ ಪಂಪ್)...',
      askBtn: 'ಕೇಳಿ →',
      suggestedLabel: 'ಸಲಹೆಗಳು:',
      citizenSpokenQuery: 'ರೈತರು ಕೇಳಿದ ಧ್ವನಿ ಪ್ರಶ್ನೆ',
      gazetteGuidance: 'ಅಧಿಕೃತ ಗೆಜೆಟ್ ಮಾರ್ಗದರ್ಶನ',
      aiExecutiveSummary: 'ಎಐ ಶಾಸನಬದ್ಧ ಸಾರಾಂಶ ಮತ್ತು ಮುಖ್ಯ ನಿಯಮಗಳು',
      verifiedSources: 'ದೃಢೀಕೃತ ಸರ್ಕಾರಿ ಗೆಜೆಟ್ ಆಕರಗಳು',
      identifiedSchemes: 'ಅರ್ಹ ಸರ್ಕಾರಿ ಕೃಷಿ ಯೋಜನೆಗಳು',
      applyParchaa: 'ಪರ್ಚಾದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ →',
      details: 'ವಿವರಗಳು',
      replayVoice: 'ಧ್ವನಿ ಪ್ಲೇ ಮಾಡಿ',
      pauseVoice: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
      savedToDb: 'ಡಾಟಾಬೇಸ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿದೆ',
      noArchivesTitle: 'ಯಾವುದೇ ಧ್ವನಿ ಕರೆಗಳು ದಾಖಲಾಗಿಲ್ಲ',
      noArchivesSub: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಧ್ವನಿ ಸಂಭಾಷಣೆ ನಡೆಸಿಲ್ಲ. ವಾಣಿ ಜೊತೆ ಮಾತನಾಡಿ ಸ್ವಯಂಚಾಲಿತ ಎಐ ಸಾರಾಂಶವನ್ನು ಪಡೆಯಿರಿ.',
      startVoiceCall: 'ಧ್ವನಿ ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ →',
      searchArchivesPlaceholder: 'ಪ್ರಶ್ನೆಗಳು, ಬೆಳೆಗಳು ಅಥವಾ ಸಬ್ಸಿಡಿ ಕೀವರ್ಡ್ ಹುಡುಕಿ...',
      allLanguages: 'ಎಲ್ಲಾ ಭಾಷೆಗಳು',
      deleteArchive: 'ದಾಖಲೆ ಅಳಿಸಿ',
      backToArchives: '← ಕರೆ ಇತಿಹಾಸಕ್ಕೆ ಹಿಂತಿರುಗಿ',
      downloadMp3: 'MP3 ಡೌನ್‌ಲೋಡ್',
      nextStepsTitle: 'ರೈತರು ಮಾಡಬೇಕಾದ ಮುಂದಿನ ಹಂತಗಳು',
      step1: 'ದೃಢೀಕೃತ ಕ್ಯೂಆರ್ ಕೋಡ್ ಹೊಂದಿರುವ ಏಕ-ಪುಟ ಪರ್ಚಾ ಅರ್ಜಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
      step2: 'ನಿಮ್ಮ ಸರ್ವೆ ನಂಬರ್ ಪಹಣಿ/RTC ದಾಖಲೆ ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಕಾಗಜ್‌ಚೆಕ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
      step3: 'ಅಂತಿಮ ಬೆರಳಚ್ಚು ಸಲ್ಲಿಕೆಗಾಗಿ ಸ್ಥಳೀಯ ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
      minimizeSummary: 'ಸಾರಾಂಶ ಮರೆಮಾಡಿ',
      expandSummary: 'ಸಂಪೂರ್ಣ ಎಐ ಸಾರಾಂಶ ತೋರಿಸಿ',
      filterTime: 'ಸಮಯಾವಧಿ:',
      timeAll: 'ಎಲ್ಲಾ ಸಮಯ',
      timeToday: 'ಇಂದು',
      timeWeek: 'ಈ ವಾರ',
      timeMonth: 'ಈ ತಿಂಗಳು',
      sortNewest: 'ಹೊಸದು ಮೊದಲು',
      sortOldest: 'ಹಳೆಯದು ಮೊದಲು',
      sortDuration: 'ದೀರ್ಘ ಅವಧಿ',
      clearAllArchives: 'ಎಲ್ಲಾ ಕರೆ ದಾಖಲೆ ಅಳಿಸಿ',
      matchingResults: 'ಹೊಂದಾಣಿಕೆಯಾದ ದಾಖಲೆಗಳು',
    },
  },

  // 3. HINDI
  hi: {
    sidebar: {
      overview: 'अवलोकन केंद्र',
      schemes: 'योजना खोज',
      nitirag: 'नीति RAG सलाहकार',
      vanibot: 'वाणी वॉइस असिस्टेंट',
      kagazcheck: 'दस्तावेज सत्यापन',
      parchaa: 'आवेदन पर्चा',
      farmMap: 'खेत नक्शा GIS',
      applications: 'आवेदन ट्रैकर',
      chaupal: 'किसान चौपाल',
      csc: 'CSC केंद्र मोड',
      notifications: 'व्हाट्सएप और SMS अलर्ट',
      profile: 'किसान प्रोफाइल डॉसियर',
      logout: 'लॉग आउट',
      language: 'भाषा',
      liveDossier: 'लाइव डॉसियर',
      verifiedCitizen: 'सत्यापित किसान',
    },
    overview: {
      welcomeGreeting: 'वापसी पर स्वागत है,',
      welcomeSub: 'कृषि योजनाओं, भू-अभिलेख और प्रत्यक्ष लाभ अंतरण (DBT) के लिए आपका आधिकारिक मंच।',
      editProfileBanner: 'पूरी प्रोफाइल और भूमि रिकॉर्ड देखें →',
      kpiSchemes: 'पात्र योजनाएं',
      kpiSchemesSub: 'सटीक मिलान',
      kpiDbt: 'DBT बैंक स्थिति',
      kpiDbtSub: 'आधार लिंक',
      kpiLand: 'भूमि का रकबा',
      kpiLandSub: 'खसरा क्षेत्रफल',
      kpiDocs: 'दस्तावेज तिजोरी',
      kpiDocsSub: 'सत्यापन तैयार',
      sectionModules: 'प्रमुख कृषि सेवाएं व मॉड्यूल',
      sectionModulesSub: 'बिना किसी बिचौलिये के सीधे सरकारी योजनाओं का लाभ उठाएं।',
      launchModule: 'मॉड्यूल खोलें →',
    },
    profile: {
      title: 'किसान नागरिक प्रोफाइल और भूमि डॉसियर',
      subtitle: 'आपकी नागरिक जानकारी, खसरा/खतौनी भूमि विवरण, फसल और सरकारी योजनाओं की पात्रता का रिकॉर्ड।',
      editProfileBtn: 'प्रोफाइल व रिकॉर्ड संपादित करें',
      personalTitle: '1. नागरिक पहचान व सामाजिक श्रेणी',
      personalDesc: 'नाम, मोबाइल, आयु, जाति वर्ग और वार्षिक पारिवारिक आय।',
      dbtTitle: '2. सरकारी योजनाएं व DBT बैंक लिंकेज स्थिति',
      dbtDesc: 'प्रत्यक्ष बैंक ट्रांसफर और केंद्रीय कल्याण योजनाओं में सक्रिय पंजीकरण।',
      landTitle: '3. भूमि जोत, मिट्टी का प्रकार और सिंचाई',
      landDesc: 'खसरा संख्या, कुल एकड़, मिट्टी का वर्गीकरण और सिंचाई स्रोत।',
      cropsTitle: '4. फसल चक्र, कृषि मशीनरी और पशुधन संपदा',
      cropsDesc: 'खरीफ/रबी फसलें, ट्रैक्टर व कृषि उपकरण और डेयरी पशु।',
      mapTitle: '5. खेत का GIS नक्शा और सत्यापित पता',
      mapDesc: 'नक्शे पर चिह्नित खेत का सटीक स्थान और प्रशासनिक पता।',
      mediaTitle: '6. खेत की तस्वीरें व भूमि दस्तावेज',
      mediaDesc: 'अपलोड की गई खेत की तस्वीरें और खतौनी / 7-12 दस्तावेज।',
      noLandPhotos: 'खेत की कोई तस्वीर अपलोड नहीं की गई।',
      noDocPhotos: 'कोई भूमि दस्तावेज अपलोड नहीं किया गया।',
      dbtActive: 'सत्यापित सक्रिय',
      dbtPending: 'लिंक नहीं है',
    },
    editProfile: {
      title: 'किसान प्रोफाइल और भूमि विवरण संपादित करें',
      subtitle: 'अपनी व्यक्तिगत जानकारी, भूमि, फसल या नक्शे के निर्देशांक आसानी से अपडेट करें।',
      backBtn: '← प्रोफाइल पर वापस जाएं',
      saveBtn: 'डेटाबेस में सहेजें',
      cancelBtn: 'रद्द करें',
      saving: 'सहेजा जा रहा है...',
      successMessage: 'प्रोफाइल सफलतापूर्वक अपडेट हो गई! डॉसियर पर पुनर्निर्देशित किया जा रहा है...',
    },
    vani: {
      title: 'वाणी-बॉट बहुभाषी नागरिक वॉइस एआई',
      subtitle: 'कन्नड़, हिन्दी, तेलुगु, तमिल, मराठी या अंग्रेजी में स्वाभाविक रूप से बोलकर कृषि सब्सिडी, सॉइल कार्ड और सरकारी लाभों की जानकारी पाएं।',
      liveTab: 'लाइव वॉइस असिस्टेंट',
      archivesTab: 'कॉल इतिहास और एआई सारांश',
      dialect: 'भाषा:',
      tapToSpeak: 'प्रश्न पूछने के लिए माइक दबाएं',
      listening: 'सुन रहे हैं... स्पष्ट बोलें • समाप्त करने के लिए दबाएं',
      transcribing: 'आवाज को टेक्स्ट में बदला जा रहा है...',
      synthesizing: 'सरकारी राजपत्र नियमों का विश्लेषण हो रहा है...',
      readyStatus: 'तैयार',
      typePlaceholder: 'या अपना प्रश्न लिखें (जैसे: पीएम-किसान, ड्रिप सिंचाई सब्सिडी, कुसुम सोलर पंप)...',
      askBtn: 'पूछें →',
      suggestedLabel: 'सुझाए गए:',
      citizenSpokenQuery: 'किसान द्वारा पूछा गया प्रश्न',
      gazetteGuidance: 'राजपत्र आधारित सरकारी सलाह',
      aiExecutiveSummary: 'एआई सारांश व मुख्य पात्रता बिंदु',
      verifiedSources: 'सत्यापित सरकारी राजपत्र स्रोत',
      identifiedSchemes: 'पात्र सरकारी कृषि योजनाएं',
      applyParchaa: 'पर्चा में आवेदन करें →',
      details: 'विवरण',
      replayVoice: 'आवाज सुनें',
      pauseVoice: 'आवाज रोकें',
      savedToDb: 'डेटाबेस में सहेजा गया',
      noArchivesTitle: 'कोई वॉइस रिकॉर्डिंग नहीं मिली',
      noArchivesSub: 'आपने अभी तक कोई वॉइस कॉल नहीं की है। एआई सारांश और ऑडियो प्राप्त करने के लिए वाणी से बात करें।',
      startVoiceCall: 'वॉइस बातचीत शुरू करें →',
      searchArchivesPlaceholder: 'प्रश्न, फसल या सब्सिडी कीवर्ड खोजें...',
      allLanguages: 'सभी भाषाएं',
      deleteArchive: 'रिकॉर्ड हटाएं',
      backToArchives: '← कॉल इतिहास पर वापस जाएं',
      downloadMp3: 'MP3 डाउनलोड',
      nextStepsTitle: 'किसान के लिए आवश्यक अगले कदम',
      step1: 'क्यूआर कोड वाला सिंगल-पेज पर्चा आवेदन पत्र डाउनलोड करें।',
      step2: 'कागजचेक पर जाकर खसरा/खतौनी दस्तावेज की वैधता की जांच करें।',
      step3: 'अंतिम बायोमेट्रिक सत्यापन के लिए स्थानीय सीएससी केंद्र या ग्राम पंचायत जाएं।',
      minimizeSummary: 'सारांश छुपाएं',
      expandSummary: 'पूरा एआई सारांश देखें',
      filterTime: 'समय सीमा:',
      timeAll: 'सभी समय',
      timeToday: 'आज',
      timeWeek: 'इस सप्ताह',
      timeMonth: 'इस महीने',
      sortNewest: 'नवीनतम पहले',
      sortOldest: 'पुराने पहले',
      sortDuration: 'लंबी अवधि',
      clearAllArchives: 'सभी रिकॉर्ड हटाएं',
      matchingResults: 'मिले हुए परिणाम',
    },
  },

  // 4. TELUGU
  te: {
    sidebar: {
      overview: 'అవలోకన కేంద్రం',
      schemes: 'పథకాల అన్వేషణ',
      nitirag: 'నీతి RAG సలహాదారు',
      vanibot: 'వాణి వాయిస్ అసిస్టెంట్',
      kagazcheck: 'పత్రాల తనిఖీ',
      parchaa: 'దరఖాస్తు పర్చా',
      farmMap: 'వ్యవసాయ పటం GIS',
      applications: 'దరఖాస్తు ట్రాకర్',
      chaupal: 'కిసాన్ చౌపాల్',
      csc: 'గ్రామ సేవా కేంద్రం',
      notifications: 'వాట్సాప్ & SMS హెచ్చరికలు',
      profile: 'రైతు ప్రొఫైల్ రికార్డు',
      logout: 'లాగ్ అవుట్',
      language: 'భాష',
      liveDossier: 'లైవ్ రికార్డు',
      verifiedCitizen: 'ధృవీకరించబడిన రైతు',
    },
    overview: {
      welcomeGreeting: 'తిరిగి స్వాగతం,',
      welcomeSub: 'వ్యవసాయ పథకాలు, భూ రికార్డులు మరియు ప్రభుత్వ రాయితీల అధికారిక వేదిక.',
      editProfileBanner: 'పూర్తి ప్రొఫైల్ మరియు భూమి రికార్డులను చూడండి →',
      kpiSchemes: 'అర్హతగల పథకాలు',
      kpiSchemesSub: 'ఖచ్చితమైన సరిపోలిక',
      kpiDbt: 'DBT బ్యాంక్ స్థితి',
      kpiDbtSub: 'ఆధార్ లింక్',
      kpiLand: 'భూమి విస్తీర్ణం',
      kpiLandSub: 'పట్టా విస్తీర్ణం',
      kpiDocs: 'పత్రాల నిల్వ',
      kpiDocsSub: 'తనిఖీకి సిద్ధం',
      sectionModules: 'ప్రధాన వ్యవసాయ సేవలు & మాడ్యూల్స్',
      sectionModulesSub: 'దళారులు లేకుండా ప్రభుత్వ పథకాల ప్రయోజనాలను నేరుగా పొందండి.',
      launchModule: 'మాడ్యూల్ తెరవండి →',
    },
    profile: {
      title: 'రైతు పౌర ప్రొఫైల్ మరియు భూమి రికార్డులు',
      subtitle: 'మీ పౌర వివరాలు, పట్టాదారు పాస్ పుస్తకం, పంటలు మరియు ప్రభుత్వ పథకాల అర్హత వివరాలు.',
      editProfileBtn: 'ప్రొఫైల్ సవరించండి',
      personalTitle: '1. పౌర గుర్తింపు & సామాజిక వర్గం',
      personalDesc: 'పేరు, మొబైల్, వయస్సు, కుల వర్గం మరియు వార్షిక ఆదాయం.',
      dbtTitle: '2. సంక్షేమ పథకాలు & DBT బ్యాంక్ అనుసంధాన స్థితి',
      dbtDesc: 'ప్రత్యక్ష నగదు బదిలీ మరియు కేంద్ర సంక్షేమ పథకాల నమోదు.',
      landTitle: '3. భూమి విస్తీర్ణం, నేల రకం & సాగునీరు',
      landDesc: 'సర్వే నంబర్, ఎకరాలు, నేల వర్గీకరణ మరియు నీటి వనరులు.',
      cropsTitle: '4. పంటల విధానం, వ్యవసాయ పరికరాలు & పశుసంపద',
      cropsDesc: 'ఖరీఫ్/రబీ పంటలు, ట్రాక్టర్ పరికరాలు మరియు పాడి పశువులు.',
      mapTitle: '5. పొలం GIS పటం మరియు అధికారిక చిరునామా',
      mapDesc: 'మ్యాప్‌లో గుర్తించబడిన పొలం ఖచ్చితమైన స్థానం మరియు చిరునామా.',
      mediaTitle: '6. పొలం ఫోటోలు & భూమి పత్రాలు',
      mediaDesc: 'అప్‌లోడ్ చేసిన పొలం ఫోటోలు మరియు అడంగల్ / 1-B పత్రాలు.',
      noLandPhotos: 'పొలం ఫోటోలు ఏవీ అప్‌లోడ్ చేయలేదు.',
      noDocPhotos: 'భూమి పత్రాలు ఏవీ అప్‌లోడ్ చేయలేదు.',
      dbtActive: 'ధృవీకరించబడింది',
      dbtPending: 'లింక్ కాలేదు',
    },
    editProfile: {
      title: 'రైతు ప్రొఫైల్ మరియు భూమి వివరాలను సవరించండి',
      subtitle: 'మీ వివరాలు, భూమి, పంటలు లేదా మ్యాప్ కోఆర్డినేట్‌లను సులభంగా అప్‌డేట్ చేయండి.',
      backBtn: '← ప్రొఫైల్‌కు తిరిగి వెళ్లండి',
      saveBtn: 'మార్పులను సేవ్ చేయండి',
      cancelBtn: 'రద్దు చేయండి',
      saving: 'సేవ్ అవుతోంది...',
      successMessage: 'ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది! రీడైరెక్ట్ అవుతోంది...',
    },
    vani: {
      title: 'వాణి-బాట్ బహుభాషా వ్యవసాయ వాయిస్ ఎఐ',
      subtitle: 'కన్నడ, హిందీ, తెలుగు, తమిళం, మరాఠీ లేదా ఇంగ్లీషులో మాట్లాడి వ్యవసాయ రాయితీలు, సాయిల్ కార్డ్ మరియు పథకాల వివరాలు తెలుసుకోండి.',
      liveTab: 'లైవ్ వాయిస్ అసిస్టెంట్',
      archivesTab: 'వాయిస్ కాల్ రికార్డులు & ఎఐ సారాంశం',
      dialect: 'భాష:',
      tapToSpeak: 'ప్రశ్న అడగడానికి మైక్ నొక్కండి',
      listening: 'వింటున్నాము... స్పష్టంగా మాట్లాడండి • ముగించడానికి నొక్కండి',
      transcribing: 'వాయిస్ టెక్స్ట్‌గా మార్చబడుతోంది...',
      synthesizing: 'ప్రభుత్వ గెజిట్ నిబంధనలను విశ్లేషిస్తోంది...',
      readyStatus: 'సిద్ధంగా ఉంది',
      typePlaceholder: 'లేదా మీ ప్రశ్నను టైప్ చేయండి (ఉదా: పీఎం-కిసాన్, డ్రిప్ సబ్సిడీ, సోలార్ పంప్)...',
      askBtn: 'అడగండి →',
      suggestedLabel: 'సూచనలు:',
      citizenSpokenQuery: 'రైతు అడిగిన వాయిస్ ప్రశ్న',
      gazetteGuidance: 'అధికారిక గెజిట్ మార్గదర్శకాలు',
      aiExecutiveSummary: 'ఎఐ సారాంశం & అర్హత పాయింట్లు',
      verifiedSources: 'ధృవీకరించబడిన ప్రభుత్వ మూలాలు',
      identifiedSchemes: 'అర్హతగల ప్రభుత్వ పథకాలు',
      applyParchaa: 'పర్చాలో దరఖాస్తు చేయండి →',
      details: 'వివరాలు',
      replayVoice: 'వాయిస్ వినండి',
      pauseVoice: 'వాయిస్ ఆపండి',
      savedToDb: 'డేటాబేస్‌లో సేవ్ చేయబడింది',
      noArchivesTitle: 'వాయిస్ రికార్డులు ఏవీ లేవు',
      noArchivesSub: 'మీరు ఇంకా ఎటువంటి వాయిస్ కాల్స్ చేయలేదు. వాణితో మాట్లాడి తక్షణ ఎఐ సారాంశం పొందండి.',
      startVoiceCall: 'వాయిస్ కాల్ ప్రారంభించండి →',
      searchArchivesPlaceholder: 'ప్రశ్నలు, పంటలు లేదా రాయితీలు శోధించండి...',
      allLanguages: 'అన్ని భాషలు',
      deleteArchive: 'రికార్డు తొలగించు',
      backToArchives: '← కాల్ రికార్డులకు తిరిగి వెళ్లండి',
      downloadMp3: 'MP3 డౌన్‌లోడ్',
      nextStepsTitle: 'రైతు తీసుకోవలసిన తదుపరి చర్యలు',
      step1: 'క్యూఆర్ కోడ్ కలిగిన సింగిల్ పేజీ పర్చా దరఖాస్తును డౌన్‌లోడ్ చేసుకోండి.',
      step2: 'కాగజ్‌చెక్ ద్వారా మీ సర్వే నంబర్ అడంగల్ రికార్డును సరిచూసుకోండి.',
      step3: 'బయోమెట్రిక్ సమర్పణ కోసం స్థానిక సిఎస్‌సి లేదా రైతు సేవా కేంద్రాన్ని సందర్శించండి.',
      minimizeSummary: 'సారాంశం కుదించు',
      expandSummary: 'పూర్తి ఎఐ సారాంశం చూపించు',
      filterTime: 'సమయ పరిధి:',
      timeAll: 'మొత్తం సమయం',
      timeToday: 'ఈ రోజు',
      timeWeek: 'ఈ వారం',
      timeMonth: 'ఈ నెల',
      sortNewest: 'కొత్తవి మొదట',
      sortOldest: 'పాతవి మొదట',
      sortDuration: 'ఎక్కువ సమయం',
      clearAllArchives: 'అన్ని రికార్డులు తొలగించు',
      matchingResults: 'సరిపోలిన రికార్డులు',
    },
  },

  // 5. TAMIL
  ta: {
    sidebar: {
      overview: 'கண்ணோட்ட மையம்',
      schemes: 'திட்டங்கள் கண்டறிதல்',
      nitirag: 'நீதி RAG ஆலோசகர்',
      vanibot: 'வாணி குரல் உதவியாளர்',
      kagazcheck: 'ஆவண சரிபார்ப்பு',
      parchaa: 'விண்ணப்ப பர்ச்சா',
      farmMap: 'பண்ணை வரைபடம் GIS',
      applications: 'விண்ணப்ப நிலை',
      chaupal: 'கிசான் சௌபால்',
      csc: 'இ-சேவை மையம்',
      notifications: 'வாட்ஸ்அப் & SMS அறிவிப்புகள்',
      profile: 'விவசாயி சுயவிவரம்',
      logout: 'வெளியேறு',
      language: 'மொழி',
      liveDossier: 'நேரலை ஆவணம்',
      verifiedCitizen: 'சரிபார்க்கப்பட்ட குடிமகன்',
    },
    overview: {
      welcomeGreeting: 'மீண்டும் நல்வரவு,',
      welcomeSub: 'வேளாண் திட்டங்கள், நில வரைபடம் மற்றும் நேரடி மானியங்களுக்கான உங்கள் அதிகாரப்பூர்வ தளம்.',
      editProfileBanner: 'முழு சுயவிவரம் மற்றும் நில ஆவணங்களைக் காண்க →',
      kpiSchemes: 'தகுதியான திட்டங்கள்',
      kpiSchemesSub: 'நேரடி பொருத்தம்',
      kpiDbt: 'DBT வங்கி இணைப்பு',
      kpiDbtSub: 'ஆதார் இணைக்கப்பட்டது',
      kpiLand: 'நிலப்பரப்பு',
      kpiLandSub: 'பட்டா பரப்பளவு',
      kpiDocs: 'ஆவண பெட்டகம்',
      kpiDocsSub: 'சரிபார்ப்புக்கு தயார்',
      sectionModules: 'முக்கிய வேளாண் சேவைகள் & தொகுதிகள்',
      sectionModulesSub: 'இடைத்தரகர்கள் இன்றி அரசு திட்டங்களின் பயன்களை நேரடியாகப் பெறுங்கள்.',
      launchModule: 'சேவையைத் திறக்கவும் →',
    },
    profile: {
      title: 'விவசாயி சுயவிவரம் மற்றும் நில ஆவணம்',
      subtitle: 'உங்கள் விவரங்கள், பட்டா சிட்டா நில பதிவுகள், பயிர்கள் மற்றும் அரசு நலத்திட்ட தகுதிகள்.',
      editProfileBtn: 'சுயவிவரத்தைத் திருத்தவும்',
      personalTitle: '1. குடிமக்கள் அடையாளம் & சமூக வகைப்பாடு',
      personalDesc: 'பெயர், அலைபேசி, வயது, சமூக பிரிவு மற்றும் குடும்ப வருமானம்.',
      dbtTitle: '2. அரசு நலத்திட்டங்கள் & DBT வங்கி இணைப்பு நிலை',
      dbtDesc: 'நேரடி வங்கி பரிமாற்றம் மற்றும் மத்திய நலத்திட்ட பதிவுகள்.',
      landTitle: '3. நிலப்பரப்பு, மண் வகை & பாசன அமைப்புகள்',
      landDesc: 'சர்வே எண், ஏக்கர், மண் வகை மற்றும் நீர் பாசன ஆதாரம்.',
      cropsTitle: '4. பயிர் முறைகள், இயந்திரங்கள் & கால்நடை சொத்துக்கள்',
      cropsDesc: 'பயிரிடப்படும் பயிர்கள், டிராக்டர் உபகரணங்கள் மற்றும் கால்நடைகள்.',
      mapTitle: '5. பண்ணை GIS வரைபடம் மற்றும் சரிபார்க்கப்பட்ட முகவரி',
      mapDesc: 'வரைபடத்தில் குறிக்கப்பட்ட பண்ணையின் துல்லியமான இருப்பிடம் மற்றும் முகவரி.',
      mediaTitle: '6. பண்ணை புகைப்படங்கள் & பட்டா ஆவணங்கள்',
      mediaDesc: 'பதிவேற்றப்பட்ட பண்ணை புகைப்படங்கள் மற்றும் பட்டா / சிட்டா ஆவணங்கள்.',
      noLandPhotos: 'பண்ணை புகைப்படங்கள் எதுவும் பதிவேற்றப்படவில்லை.',
      noDocPhotos: 'நில ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை.',
      dbtActive: 'சரிபார்க்கப்பட்டது',
      dbtPending: 'இணைக்கப்படவில்லை',
    },
    editProfile: {
      title: 'விவசாயி சுயவிவரம் மற்றும் நில விவரங்களைத் திருத்தவும்',
      subtitle: 'உங்கள் விவரங்கள், நிலம், பயிர்கள் அல்லது வரைபட தகவல்களை எளிதாக புதுப்பிக்கவும்.',
      backBtn: '← சுயவிவரத்திற்குத் திரும்பு',
      saveBtn: 'மாற்றங்களைச் சேமிக்கவும்',
      cancelBtn: 'ரத்து செய்',
      saving: 'சேமிக்கப்படுகிறது...',
      successMessage: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது! திருப்பிவிடப்படுகிறது...',
    },
    vani: {
      title: 'வாணி-பாட் பன்மொழி வேளாண் குரல் எஐ',
      subtitle: 'கன்னடம், இந்தி, தெலுங்கு, தமிழ், மராத்தி அல்லது ஆங்கிலத்தில் பேசி வேளாண் மானியங்கள், மண் அட்டை மற்றும் அரசு திட்ட தகவல்களைப் பெறுங்கள்.',
      liveTab: 'நேரலை குரல் உதவியாளர்',
      archivesTab: 'குரல் அழைப்பு பதிவுகள் & எஐ சுருக்கம்',
      dialect: 'மொழி:',
      tapToSpeak: 'பேச மைக் பொத்தானை அழுத்தவும்',
      listening: 'கேட்கிறது... தெளிவாகப் பேசுங்கள் • முடிக்க அழுத்தவும்',
      transcribing: 'குரல் உரையாக மாற்றப்படுகிறது...',
      synthesizing: 'அரசு அரசிதழ் விதிகள் ஆய்வு செய்யப்படுகின்றன...',
      readyStatus: 'தயார்',
      typePlaceholder: 'அல்லது உங்கள் கேள்வியை தட்டச்சு செய்யவும் (எ.கா: பிஎம்-கிசான், சொட்டு நீர் பாசனம், சோலார் பம்ப்)...',
      askBtn: 'கேட்க →',
      suggestedLabel: 'பரிந்துரைகள்:',
      citizenSpokenQuery: 'விவசாயி கேட்ட குரல் கேள்வி',
      gazetteGuidance: 'அரசிதழ் வழிகாட்டுதல்',
      aiExecutiveSummary: 'எஐ சுருக்கம் & தகுதி விவரங்கள்',
      verifiedSources: 'சரிபார்க்கப்பட்ட அரசு மூலங்கள்',
      identifiedSchemes: 'தகுதியான அரசு திட்டங்கள்',
      applyParchaa: 'பர்ச்சாவில் விண்ணப்பிக்கவும் →',
      details: 'விவரங்கள்',
      replayVoice: 'குரலைக் கேட்கவும்',
      pauseVoice: 'நிறுத்தவும்',
      savedToDb: 'தரவுத்தளத்தில் சேமிக்கப்பட்டது',
      noArchivesTitle: 'குரல் பதிவுகள் எதுவும் இல்லை',
      noArchivesSub: 'நீங்கள் இதுவரை எந்த குரல் அழைப்பும் செய்யவில்லை. வாணியுடன் பேசி உடனடி எஐ சுருக்கத்தைப் பெறுங்கள்.',
      startVoiceCall: 'குரல் அழைப்பைத் தொடங்கவும் →',
      searchArchivesPlaceholder: 'கேள்விகள், பயிர்கள் அல்லது மானியங்களைத் தேடுங்கள்...',
      allLanguages: 'அனைத்து மொழிகள்',
      deleteArchive: 'பதிவை நீக்கு',
      backToArchives: '← அழைப்புப் பதிவுகளுக்குத் திரும்பு',
      downloadMp3: 'MP3 பதிவிறக்கம்',
      nextStepsTitle: 'விவசாயி செய்ய வேண்டிய அடுத்த கட்ட நடவடிக்கைகள்',
      step1: 'சரிபார்க்கப்பட்ட க்யூஆர் குறியீட்டுடன் கூடிய பர்ச்சா விண்ணப்பத்தைப் பதிவிறக்கவும்.',
      step2: 'காகஸ்செக் மூலம் பட்டா சிட்டா ஆவணங்களைச் சரிபார்க்கவும்.',
      step3: 'இறுதி கைரேகை சரிபார்ப்பிற்கு உள்ளூர் இ-சேவை மையத்திற்குச் செல்லவும்.',
      minimizeSummary: 'சுருக்கத்தைக் குறைக்கவும்',
      expandSummary: 'முழு எஐ சுருக்கத்தைக் காட்டு',
      filterTime: 'கால அளவு:',
      timeAll: 'அனைத்து நேரம்',
      timeToday: 'இன்று',
      timeWeek: 'இந்த வாரம்',
      timeMonth: 'இந்த மாதம்',
      sortNewest: 'புதியவை முதலில்',
      sortOldest: 'பழையவை முதலில்',
      sortDuration: 'நீண்ட கால அளவு',
      clearAllArchives: 'அனைத்து பதிவுகளையும் நீக்கு',
      matchingResults: 'பொருந்தும் பதிவுகள்',
    },
  },

  // 6. MARATHI
  mr: {
    sidebar: {
      overview: 'अवलोकन केंद्र',
      schemes: 'योजना शोध',
      nitirag: 'नीती RAG सल्लागार',
      vanibot: 'वाणी व्हॉइस असिस्टंट',
      kagazcheck: 'कागदपत्र तपासणी',
      parchaa: 'अर्ज पर्चा',
      farmMap: 'शेत नकाशा GIS',
      applications: 'अर्ज ट्रॅकर',
      chaupal: 'किसान चौपाल',
      csc: 'CSC केंद्र मोड',
      notifications: 'व्हॉट्सॲप आणि SMS सूचना',
      profile: 'शेतकरी प्रोफाइल व जमीन नोंद',
      logout: 'लॉग आउट',
      language: 'भाषा',
      liveDossier: 'थेट डॉझियर',
      verifiedCitizen: 'सत्यापित नागरिक',
    },
    overview: {
      welcomeGreeting: 'स्वागत आहे,',
      welcomeSub: 'कृषी योजना, ७/१२ भू-अभिलेख आणि थेट लाभ हस्तांतरण (DBT) साठी तुमचे अधिकृत व्यासपीठ.',
      editProfileBanner: 'संपूर्ण प्रोफाइल आणि जमीन अभिलेख पहा →',
      kpiSchemes: 'पात्र योजना',
      kpiSchemesSub: 'थेट पडताळणी',
      kpiDbt: 'DBT बँक स्थिती',
      kpiDbtSub: 'आधार लिंक',
      kpiLand: 'जमीन धारणा',
      kpiLandSub: 'गट क्षेत्रफळ',
      kpiDocs: 'कागदपत्र तिजोरी',
      kpiDocsSub: 'तपासणी सज्ज',
      sectionModules: 'प्रमुख कृषी सेवा व मॉड्युल्स',
      sectionModulesSub: 'कोणत्याही मध्यस्थाशिवाय थेट सरकारी योजनांचा लाभ घ्या.',
      launchModule: 'मॉड्यूल उघडा →',
    },
    profile: {
      title: 'शेतकरी नागरिक प्रोफाइल व जमीन डॉझियर',
      subtitle: 'तुमची नागरिक माहिती, ७/१२ जमिनीचा तपशील, पिके आणि सरकारी योजनांच्या पात्रतेचा संपूर्ण रेकॉर्ड.',
      editProfileBtn: 'प्रोफाइल संपादित करा',
      personalTitle: '1. नागरिक ओळख व सामाजिक श्रेणी',
      personalDesc: 'नाव, मोबाइल, वय, जात संवर्ग आणि वार्षिक उत्पन्न.',
      dbtTitle: '2. सरकारी योजना व DBT बँक संलग्नता स्थिती',
      dbtDesc: 'थेट बँक अनुदान आणि केंद्रीय योजनांमधील सक्रिय नोंदणी.',
      landTitle: '3. जमीन धारणा, मातीचा प्रकार आणि सिंचन',
      landDesc: 'गट/सर्व्हे नंबर, एकूण एकर, मातीचा प्रकार आणि जलस्रोत.',
      cropsTitle: '4. पीक पद्धती, कृषी यंत्रे आणि पशुधन संपत्ती',
      cropsDesc: 'खरीप/रब्बी पिके, मालकीची कृषी यंत्रसामग्री आणि दुग्ध व्यवसाय प्राणी.',
      mapTitle: '5. शेताचा GIS नकाशा आणि पत्ता',
      mapDesc: 'नकाशावर निश्चित केलेले शेताचे स्थान आणि अधिकृत पत्ता.',
      mediaTitle: '6. शेताचे फोटो व ७/१२ कागदपत्रे',
      mediaDesc: 'अपलोड केलेले शेताचे फोटो आणि ७/१२ किंवा जमिनीची कागदपत्रे.',
      noLandPhotos: 'शेताचा कोणताही फोटो अपलोड केलेला नाही.',
      noDocPhotos: 'कोणतेही ७/१२ किंवा कागदपत्र अपलोड केलेले नाही.',
      dbtActive: 'सत्यापित सक्रिय',
      dbtPending: 'संलग्न बाकी',
    },
    editProfile: {
      title: 'शेतकरी प्रोफाइल व जमीन तपशील संपादित करा',
      subtitle: 'आपली नागरिक माहिती, जमीन, पिके किंवा नकाशाचे निर्देशक सहज अद्ययावत करा.',
      backBtn: '← प्रोफाइलवर परत जा',
      saveBtn: 'बदल जतन करा',
      cancelBtn: 'रद्द करा',
      saving: 'जतन केले जात आहे...',
      successMessage: 'प्रोफाइल यशस्वीरीत्या अद्ययावत झाली! डॉझियरवर जात आहे...',
    },
    vani: {
      title: 'वाणी-बॉट बहुभाषिक कृषी व्हॉइस एआय',
      subtitle: 'कन्नड, हिंदी, तेलुगू, तमिळ, मराठी किंवा इंग्रजीमध्ये बोलून कृषी सबसिडी, सॉइल हेल्थ कार्ड आणि सरकारी योजनांची माहिती मिळवा.',
      liveTab: 'थेट व्हॉइस असिस्टंट',
      archivesTab: 'कॉल इतिहास आणि एआय सारांश',
      dialect: 'भाषा:',
      tapToSpeak: 'प्रश्न विचारण्यासाठी माइक दाबा',
      listening: 'ऐकत आहे... स्पष्ट बोला • संपवण्यासाठी दाबा',
      transcribing: 'आवाजाचे मजकुरात रूपांतर होत आहे...',
      synthesizing: 'सरकारी राजपत्र नियमांचे विश्लेषण सुरू आहे...',
      readyStatus: 'सज्ज',
      typePlaceholder: 'किंवा आपला प्रश्न टाइप करा (उदा: पीएम-किसान, ठिबक सिंचन अनुदान, सौर कृषी पंप)...',
      askBtn: 'विचारा →',
      suggestedLabel: 'सुचवलेले:',
      citizenSpokenQuery: 'शेतकऱ्याने विचारलेला प्रश्न',
      gazetteGuidance: 'राजपत्र आधारित सरकारी मार्गदर्शन',
      aiExecutiveSummary: 'एआय सारांश व मुख्य पात्रता मुद्दे',
      verifiedSources: 'सत्यापित सरकारी राजपत्र संदर्भ',
      identifiedSchemes: 'पात्र सरकारी कृषी योजना',
      applyParchaa: 'पर्चामध्ये अर्ज करा →',
      details: 'तपशील',
      replayVoice: 'आवाज ऐका',
      pauseVoice: 'आवाज थांबवा',
      savedToDb: 'डेटाबेसमध्ये जतन केले',
      noArchivesTitle: 'कोणतेही व्हॉइस रेकॉर्ड आढळले नाही',
      noArchivesSub: 'तुम्ही अद्याप कोणताही व्हॉइस कॉल केलेला नाही. वाणीशी संवाद साधून त्वरित एआय सारांश मिळवा.',
      startVoiceCall: 'व्हॉइस संवाद सुरू करा →',
      searchArchivesPlaceholder: 'प्रश्न, पिके किंवा अनुदान कीवर्ड शोधा...',
      allLanguages: 'सर्व भाषा',
      deleteArchive: 'नोंद हटवा',
      backToArchives: '← कॉल इतिहासावर परत जा',
      downloadMp3: 'MP3 डाउनलोड',
      nextStepsTitle: 'शेतकऱ्यासाठी पुढील महत्त्वाच्या पायऱ्या',
      step1: 'क्यूआर कोड असलेला एक-पानाचा पर्चा अर्ज डाउनलोड करा.',
      step2: 'कागदचेकवर जाऊन ७/१२ किंवा जमिनीच्या नोंदींची अचूकता तपासा.',
      step3: 'बायोमेट्रिक प्रमाणीकरणासाठी स्थानिक सीएससी किंवा ग्रामपंचायतीला भेट द्या.',
      minimizeSummary: 'सारांश संकुचित करा',
      expandSummary: 'पूर्ण एआय सारांश पहा',
      filterTime: 'कालावधी:',
      timeAll: 'सर्व वेळ',
      timeToday: 'आज',
      timeWeek: 'या आठवड्यात',
      timeMonth: 'या महिन्यात',
      sortNewest: 'नवीन आधी',
      sortOldest: 'जुने आधी',
      sortDuration: 'दीर्घ कालावधी',
      clearAllArchives: 'सर्व रेकॉर्ड हटवा',
      matchingResults: 'मिळणारे रेकॉर्ड',
    },
  },
};
