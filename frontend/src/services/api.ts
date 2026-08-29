import axios, { type AxiosInstance } from 'axios';

// Clean and resolve API Base URL dynamically
export function getCleanApiBaseUrl(): string {
  let url =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
    (typeof process !== 'undefined' && (process.env as any)?.VITE_API_BASE_URL) ||
    'http://localhost:8000';

  if (typeof url === 'string') {
    url = url.trim().replace(/\/+$/, '');
    // Strip trailing /api/v1 or /api if the user added it in the env variable
    url = url.replace(/\/api\/v1$/, '').replace(/\/api$/, '');
  }
  return url || 'http://localhost:8000';
}

const API_BASE_URL: string = getCleanApiBaseUrl();

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface CitizenProfile {
  age?: number;
  income?: number;
  state?: string;
  district?: string;
  gender?: string;
  occupation?: string;
  landholding?: number;
  category?: string;
  bpl?: boolean;
}

export interface RuleEvaluationResult {
  field: string;
  operator: string;
  expected_value: unknown;
  actual_value: unknown;
  passed: boolean;
  description?: string;
}

export interface SchemeMatchResult {
  scheme_id: string;
  scheme_name: string;
  short_description?: string;
  detailed_description?: string;
  match_score: number;
  eligible_status: boolean;
  matched_rules: RuleEvaluationResult[];
  failed_rules: RuleEvaluationResult[];
  benefits: string[];
  required_documents: string[];
  official_source_url: string;
  application_url?: string;
  category?: string;
  state?: string | null;
}

export interface EligibilityMatchResponse {
  citizen_profile: CitizenProfile;
  total_schemes_evaluated: number;
  eligible_schemes_count: number;
  results: SchemeMatchResult[];
}

export interface SchemeData {
  id: string;
  name: string;
  short_description: string;
  detailed_description: string;
  benefits: string[];
  state?: string | null;
  category?: string | null;
  occupation?: string | null;
  official_source_url: string;
  application_url?: string | null;
  required_documents: string[];
  active: boolean;
  rules?: {
    id?: string;
    field: string;
    operator: string;
    value: string;
    description?: string;
  }[];
}

export interface SourceCitation {
  title: string;
  url: string;
  domain: string;
  favicon_url: string;
  snippet: string;
}

export interface AiOverview {
  headline?: string;
  summary?: string;
  key_takeaways?: string[];
  primary_qualification?: string;
  recommended_action?: string;
}

export interface PopularSchemeCategory {
  category: string;
  schemes: Scheme[];
}

export interface SearchSchemesResponse {
  query: string;
  total_results: number;
  schemes: Scheme[];
  ai_overview?: AiOverview;
  source_citations?: SourceCitation[];
}

export interface Scheme {
  id: string;
  name: string;
  short_description: string;
  benefits: string[];
  state?: string | null;
  category?: string | null;
  application_url?: string | null;
  official_source_url: string;
  match_score?: number;
  eligible_status?: boolean;
}

export interface RealtimeSearchResponse {
  id?: string;
  query: string;
  count?: number;
  ai_overview?: AiOverview;
  schemes: SchemeData[];
  sources: SourceCitation[];
  execution_time_ms: number;
  engine: string;
}

export interface SchemeSearchHistoryItem {
  id: string;
  user_id: string;
  query: string;
  state?: string;
  language?: string;
  ai_overview?: AiOverview;
  schemes_count: number;
  schemes: SchemeData[];
  sources: SourceCitation[];
  execution_time_ms: number;
  created_at: string;
}

// Fallback scheme imagery mapping
const SCHEME_IMAGES: Record<string, string> = {
  'pm-kisan-001': '/schemediscovery.png',
  'pm-kusum-002': '/climategislinker.png',
  'pmay-g-002': '/dashboard/Application Timeline & Live Stage Tracker.png',
  'pm-jay-004': '/nitirag.png',
  'pmmvy-003': '/vani.png',
  'raitha-vidya-005': '/schemediscovery.png',
  default: '/schemediscovery.png',
};

export function getSchemeIllustration(schemeId: string, category?: string | null): string {
  if (SCHEME_IMAGES[schemeId]) return SCHEME_IMAGES[schemeId];
  const cat = (category || '').toLowerCase();
  if (cat.includes('agri') || cat.includes('farm')) return SCHEME_IMAGES['pm-kisan-001'];
  if (cat.includes('solar') || cat.includes('energy')) return SCHEME_IMAGES['pm-kusum-002'];
  if (cat.includes('hous') || cat.includes('rural')) return SCHEME_IMAGES['pmay-g-002'];
  if (cat.includes('health') || cat.includes('social')) return SCHEME_IMAGES['pm-jay-004'];
  if (cat.includes('women') || cat.includes('child')) return SCHEME_IMAGES['pmmvy-003'];
  if (cat.includes('edu') || cat.includes('scholarship')) return SCHEME_IMAGES['raitha-vidya-005'];
  return SCHEME_IMAGES['pm-kisan-001'];
}

// Axios instance with environment-driven base URL
export const apiClient: AxiosInstance = axios.create({
  baseURL: getCleanApiBaseUrl(),
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Dynamic BaseURL & JWT Token Injection
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getCleanApiBaseUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gramsetu_jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic 401 Session Expiry Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
        localStorage.removeItem('gramsetu_jwt_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Health check service to verify backend connectivity
 */
export async function checkBackendHealth(): Promise<{
  data: HealthCheckResponse;
  responseTimeMs: number;
}> {
  const startTime = performance.now();
  const response = await apiClient.get<HealthCheckResponse>('/api/v1/health');
  const responseTimeMs = Math.round(performance.now() - startTime);

  return {
    data: response.data,
    responseTimeMs,
  };
}

/**
 * YojanaMatch service to evaluate citizen profile eligibility
 */
export async function matchEligibility(
  profile: CitizenProfile
): Promise<EligibilityMatchResponse> {
  const response = await apiClient.post<EligibilityMatchResponse>(
    '/api/v1/eligibility/match',
    profile
  );
  return response.data;
}

/**
 * Fetch all active government schemes from backend database
 */
export async function fetchActiveSchemes(): Promise<SchemeData[]> {
  return getPopularSchemes();
}

export type Scheme = SchemeData;

export interface FieldValidationResult {
  field: string;
  label: string;
  extracted_value?: string | null;
  is_valid: boolean;
  rule_description: string;
  issue_reason?: string | null;
}

export interface ProfileMatchItem {
  field: string;
  profile_value?: string | null;
  document_value?: string | null;
  matched: boolean;
  confidence: number;
  details: string;
}

export interface DocumentAnalysisResult {
  document_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  document_type: string;
  document_type_code: string;
  document_type_confidence: number;
  is_detected: boolean;
  is_readable: boolean;
  image_quality_score: number;
  extracted_fields: Record<string, any>;
  fields_validation: FieldValidationResult[];
  validity_status: 'VALID' | 'WARNING' | 'INVALID' | 'EXPIRED';
  citizen_details_match: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'UNVERIFIED';
  profile_match_details: ProfileMatchItem[];
  overall_status: 'VALID' | 'WARNING' | 'INVALID';
  summary_notes: string[];
  recommended_action: string;
}

export interface ChecklistItem {
  document_code: string;
  document_name: string;
  required: boolean;
  status: 'VALID' | 'WARNING' | 'MISSING' | 'INVALID';
  uploaded_document_id?: string | null;
  details: string;
  action_needed: string;
}

export interface SchemeReadinessAudit {
  scheme_id: string;
  scheme_name: string;
  total_required_docs: number;
  ready_docs_count: number;
  readiness_percentage: number;
  is_ready_to_apply: boolean;
  checklist: ChecklistItem[];
  critical_missing_docs: string[];
  overall_recommendation: string;
}

export interface KagazAuditedDocument {
  doc_id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  cloudinary_url?: string;
  detected_type: string;
  confidence: number;
  quality_score: number;
  extracted_fields: Record<string, any>;
  raw_text_snippet?: string;
  field_validations: FieldValidationResult[];
  profile_matches: ProfileMatchItem[];
  is_valid: boolean;
  issues: string[];
}

export interface KagazChecklistRequirement {
  document_requirement: string;
  status: 'UPLOADED_AND_VERIFIED' | 'MISSING_REQUIRED_DOCUMENT' | string;
  is_present: boolean;
}

export interface KagazCrossDocumentMatch {
  parameter: string;
  status: 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH' | string;
  details: string;
}

export interface KagazBatchAuditReport {
  audit_id: string;
  user_id: string;
  scheme_id?: string | null;
  scheme_name: string;
  overall_readiness_pct: number;
  verdict: string;
  readiness_status: string;
  documents_count: number;
  documents: KagazAuditedDocument[];
  required_documents_checklist: KagazChecklistRequirement[];
  cross_document_matches: KagazCrossDocumentMatch[];
  actionable_recommendations: string[];
  ai_executive_summary: string;
  created_at: string;
  execution_time_ms: number;
}

export interface DocumentTypeSpecification {
  code: string;
  name: string;
  aliases: string[];
  required_fields: string[];
  description: string;
  validity_period_years?: number | null;
  sample_hints: string[];
}

export interface KagazCheckAnalyzeResponse {
  document_result: DocumentAnalysisResult;
  scheme_readiness?: SchemeReadinessAudit | null;
}

/**
 * KagazCheck: Multi-Document Batch Analysis, Cloudinary Upload & Groq Cross-Matching
 */
export async function analyzeBatchDocuments(
  files: (File | Blob)[],
  fileNames: string[],
  schemeId?: string,
  schemeName?: string,
  citizenProfile?: CitizenProfile,
  userId?: string
): Promise<KagazBatchAuditReport> {
  const formData = new FormData();
  files.forEach((f, idx) => {
    formData.append('files', f, fileNames[idx] || `doc_${idx + 1}.jpg`);
  });
  if (schemeId) {
    formData.append('scheme_id', schemeId);
  }
  if (schemeName) {
    formData.append('scheme_name', schemeName);
  }
  if (citizenProfile) {
    formData.append('citizen_profile', JSON.stringify(citizenProfile));
  }
  if (userId) {
    formData.append('user_id', userId);
  }

  const response = await apiClient.post<KagazBatchAuditReport>(
    '/api/v1/kagazcheck/analyze-batch',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * KagazCheck: Get Audit History from MongoDB Atlas
 */
export async function getKagazAuditHistory(
  userId?: string,
  limit: number = 20
): Promise<{ success: boolean; count: number; history: KagazBatchAuditReport[] }> {
  const response = await apiClient.get<{ success: boolean; count: number; history: KagazBatchAuditReport[] }>(
    '/api/v1/kagazcheck/history',
    { params: { user_id: userId, limit } }
  );
  return response.data;
}

/**
 * KagazCheck: Get Single Audit Report by ID
 */
export async function getKagazAuditById(auditId: string): Promise<KagazBatchAuditReport> {
  const response = await apiClient.get<KagazBatchAuditReport>(
    `/api/v1/kagazcheck/history/${auditId}`
  );
  return response.data;
}

/**
 * KagazCheck: Delete an Audit Report Record
 */
export async function deleteKagazAuditById(auditId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/api/v1/kagazcheck/history/${auditId}`
  );
  return response.data;
}

/**
 * KagazCheck: Clear All Audit History
 */
export async function clearKagazAuditHistory(userId?: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    '/api/v1/kagazcheck/history',
    { params: { user_id: userId } }
  );
  return response.data;
}

/**
 * KagazCheck: Analyze single document
 */
export async function analyzeDocument(
  file: File | Blob,
  fileName: string = 'document.jpg',
  schemeId?: string,
  citizenProfile?: CitizenProfile
): Promise<KagazCheckAnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file, fileName);
  if (schemeId) {
    formData.append('scheme_id', schemeId);
  }
  if (citizenProfile) {
    formData.append('citizen_profile', JSON.stringify(citizenProfile));
  }

  const response = await apiClient.post<KagazCheckAnalyzeResponse>(
    '/api/v1/kagazcheck/analyze',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * KagazCheck: Audit scheme readiness across documents
 */
export async function auditSchemeReadiness(
  schemeId: string,
  documentIds?: string[]
): Promise<SchemeReadinessAudit> {
  const response = await apiClient.post<SchemeReadinessAudit>(
    '/api/v1/kagazcheck/audit',
    {
      scheme_id: schemeId,
      document_ids: documentIds || [],
    }
  );
  return response.data;
}

/**
 * KagazCheck: Fetch supported government document catalog
 */
export async function fetchSupportedDocumentTypes(): Promise<DocumentTypeSpecification[]> {
  const response = await apiClient.get<DocumentTypeSpecification[]>(
    '/api/v1/kagazcheck/document-types'
  );
  return response.data;
}

/**
 * KagazCheck: Clear in-memory session document audit store
 */
export async function clearKagazCheckSession(): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>(
    '/api/v1/kagazcheck/session/clear'
  );
  return response.data;
}

// -------------------------------------------------------------
// VANI-BOT: MULTILINGUAL CONVERSATIONAL VOICE ENGINE INTERFACES
// -------------------------------------------------------------

export interface VaniSourceCitation {
  title: string;
  url: string;
  domain: string;
  favicon_url: string;
  snippet?: string;
}

export interface VaniSchemeCard {
  scheme_id: string;
  scheme_name: string;
  category?: string | null;
  state?: string | null;
  short_summary: string;
  benefit_amount?: string | null;
  eligible_status?: boolean | null;
  match_score?: number | null;
  key_benefits: string[];
  required_documents: string[];
  official_url: string;
  domain?: string | null;
  favicon_url?: string | null;
  kagazcheck_ready: boolean;
}

export interface VaniActionLink {
  label: string;
  action_type: 'open_kagazcheck' | 'view_scheme' | 'check_eligibility' | 'open_url' | string;
  payload: Record<string, any>;
}

export interface VaniLanguageInfo {
  code: string;
  locale: string;
  name: string;
  native_name: string;
  supported_for_stt: boolean;
  supported_for_tts: boolean;
  sample_queries: string[];
}

export interface VaniTranscribeResponse {
  transcript: string;
  detected_language: string;
  confidence: number;
  status: string;
  duration_seconds?: number | null;
  provider: string;
  error_message?: string | null;
}

export interface VaniSpeakRequest {
  text: string;
  language?: string;
  speed?: number;
}

export interface VaniSpeakResponse {
  language: string;
  audio_base64?: string | null;
  mime_type: string;
  status: string;
  provider: string;
  message: string;
}

export interface VaniRespondRequest {
  query: string;
  language?: string;
  session_id?: string;
  citizen_profile?: CitizenProfile;
  context_scheme_id?: string;
  include_audio?: boolean;
}

export interface VaniRespondResponse {
  session_id: string;
  query: string;
  language: string;
  intent: string;
  reply_text: string;
  reply_audio_base64?: string | null;
  scheme_cards: VaniSchemeCard[];
  action_links: VaniActionLink[];
  sources: string[];
  source_citations?: VaniSourceCitation[];
  suggested_followups: string[];
  context_scheme_id?: string | null;
}

export interface VaniConversationTurnRequest {
  session_id?: string;
  language: string;
  text_query?: string;
  audio_base64?: string;
  citizen_profile?: CitizenProfile;
  context_scheme_id?: string;
}

export interface VaniConversationTurnResponse {
  session_id: string;
  transcribed_query: string;
  detected_language: string;
  reply_text: string;
  reply_audio_base64?: string | null;
  scheme_cards: VaniSchemeCard[];
  action_links: VaniActionLink[];
  sources: string[];
  suggested_followups: string[];
}

/**
 * Vani-Bot: Transcribe recorded citizen audio clip to regional text
 */
export async function transcribeAudio(
  file: File | Blob,
  language: string = 'kn'
): Promise<VaniTranscribeResponse> {
  const formData = new FormData();
  formData.append('file', file, 'voice_recording.webm');
  formData.append('language', language);

  const response = await apiClient.post<VaniTranscribeResponse>(
    '/api/v1/vanibot/transcribe',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Vani-Bot: Submit multilingual query and retrieve grounded civic answer with scheme cards
 */
export async function respondVani(
  req: VaniRespondRequest
): Promise<VaniRespondResponse> {
  const response = await apiClient.post<VaniRespondResponse>(
    '/api/v1/vanibot/respond',
    req
  );
  return response.data;
}

/**
 * Vani-Bot: Synthesize text into regional spoken audio
 */
export async function speakVaniText(
  req: VaniSpeakRequest
): Promise<VaniSpeakResponse> {
  const response = await apiClient.post<VaniSpeakResponse>(
    '/api/v1/vanibot/speak',
    req
  );
  return response.data;
}

/**
 * Vani-Bot: Execute unified conversation turn (audio/text -> audio/cards reply)
 */
export async function converseVani(
  req: VaniConversationTurnRequest
): Promise<VaniConversationTurnResponse> {
  const response = await apiClient.post<VaniConversationTurnResponse>(
    '/api/v1/vanibot/conversation',
    req
  );
  return response.data;
}

/**
 * Vani-Bot: Get supported Indian regional languages catalog
 */
export async function fetchVaniLanguages(): Promise<VaniLanguageInfo[]> {
  const response = await apiClient.get<VaniLanguageInfo[]>(
    '/api/v1/vanibot/languages'
  );
  return response.data;
}

/**
 * Vani-Bot: Clear multi-turn conversation session memory
 */
export async function clearVaniSession(
  sessionId: string
): Promise<{ status: string; message: string }> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  const response = await apiClient.post<{ status: string; message: string }>(
    '/api/v1/vanibot/session/clear',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

// -------------------------------------------------------------
// PARCHAA GENERATOR: APPLICATION DOSSIER GENERATOR INTERFACES
// -------------------------------------------------------------

export interface ParchaaCitizenProfile {
  name?: string | null;
  state?: string | null;
  district?: string | null;
  occupation?: string | null;
  age?: number | null;
  gender?: string | null;
  income?: number | null;
  landholding?: number | null;
  category?: string | null;
  bpl?: boolean | null;
  aadhaar_masked?: string | null;
  bank_account_masked?: string | null;
  yojanamatch_eligible?: boolean | null;
  yojanamatch_score?: number | null;
}

export interface ParchaaDocumentItem {
  document_name: string;
  document_code?: string | null;
  status: 'Ready' | 'Verified' | 'Missing' | 'Needs Attention' | 'Required';
  required: boolean;
  enclosure_note?: string | null;
  action_needed?: string | null;
}

export interface ParchaaOffice {
  office_name: string;
  department: string;
  address?: string | null;
  district?: string | null;
  state?: string | null;
  contact_info?: string | null;
  is_verified: boolean;
  unverified_notice?: string | null;
}

export interface ParchaaTimeline {
  expected_days?: number | null;
  timeline_description: string;
  is_verified: boolean;
  unverified_notice?: string | null;
}

export interface ParchaaSchemeSummary {
  scheme_id: string;
  scheme_name: string;
  category: string;
  short_description: string;
  detailed_description: string;
  target_beneficiaries: string;
  main_benefits: string[];
  eligibility_summary: string[];
  official_source_url: string;
  application_url?: string | null;
}

export interface ParchaaApplicationInfo {
  application_channel: string;
  official_portal_url?: string | null;
  physical_enclosures: string[];
  process_steps: string[];
  administrative_office: ParchaaOffice;
  processing_timeline: ParchaaTimeline;
  next_step_action: string;
}

export interface ParchaaRequest {
  scheme_id: string;
  citizen_profile?: ParchaaCitizenProfile | CitizenProfile | null;
  application_context?: Record<string, any> | null;
  document_readiness?: ParchaaDocumentItem[] | null;
  kagazcheck_ready_count?: number | null;
  kagazcheck_total_count?: number | null;
  preferred_language?: string | null;
}

export interface ParchaaResponse {
  parchaa_id: string;
  reference_number: string;
  generated_at: string;
  scheme: ParchaaSchemeSummary;
  citizen?: ParchaaCitizenProfile | null;
  documents: ParchaaDocumentItem[];
  application_info: ParchaaApplicationInfo;
  pdf_base64?: string | null;
  pdf_filename: string;
  page_count: number;
  language: string;
}

/**
 * Parchaa Generator: Compile application dossier with single-page PDF
 */
export async function generateParchaa(
  req: ParchaaRequest
): Promise<ParchaaResponse> {
  const response = await apiClient.post<ParchaaResponse>(
    '/api/v1/parchaa/generate',
    req
  );
  return response.data;
}

/**
 * Parchaa Generator: Stream raw application dossier PDF for browser download
 */
export async function downloadParchaaPdf(
  req: ParchaaRequest
): Promise<Blob> {
  const response = await apiClient.post(
    '/api/v1/parchaa/download',
    req,
    {
      responseType: 'blob',
    }
  );
  return response.data;
}

/**
 * Parchaa Generator: Fetch structured scheme preview before generation
 */
export async function fetchParchaaPreview(
  schemeId: string,
  language: string = 'en'
): Promise<ParchaaResponse> {
  const response = await apiClient.get<ParchaaResponse>(
    `/api/v1/parchaa/preview/${schemeId}`,
    {
      params: { language },
    }
  );
  return response.data;
}

/**
 * Real-Time Scheme Search & Verification using Groq + Tavily + Trafilatura
 */
export const FALLBACK_VERIFIED_SCHEMES: SchemeData[] = [
  {
    id: 'pm-kisan-001',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'Agriculture & Direct Benefit Transfer',
    state: 'Central',
    short_description: 'Income support of ₹6,000 per year in 3 equal installments to all landholding farmer families across India.',
    description: 'Central sector scheme providing ₹6,000/year directly into Aadhaar-seeded bank accounts for landholding agricultural families.',
    benefit_amount: '₹6,000 / year (3 installments)',
    benefits: [
      'Direct income support of ₹6,000 per year transferred in 3 equal installments of ₹2,000',
      '100% Direct Benefit Transfer (DBT) into Aadhaar-seeded bank accounts',
      'Covers expenses for agricultural inputs, seeds, fertilizers, and domestic needs'
    ],
    eligibility_criteria: [
      'Must be a small or marginal landholding farmer family',
      'Valid Land Ownership (ROR / RTC / Pahani / Khasra)',
      'Active Aadhaar-linked NPCI bank account'
    ],
    required_documents: ['Aadhaar Card', 'Land RTC / Pahani', 'Bank Passbook', 'Mobile Number'],
    official_source_url: 'https://pmkisan.gov.in',
    application_url: 'https://pmkisan.gov.in/RegistrationFormNew.aspx',
    domain: 'pmkisan.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=pmkisan.gov.in&sz=64'
  },
  {
    id: 'pm-kusum-b-006',
    name: 'PM-KUSUM Component B (Solar Agriculture Pump Subsidy)',
    category: 'Solar Energy & Solar Pump Subsidies',
    state: 'Central',
    short_description: 'Up to 90% capital subsidy on standalone solar agriculture pumps for small & marginal farmers.',
    description: 'Provides 30% Central Financial Assistance + 30% State Subsidy + 30% NABARD loan for standalone solar pumps up to 7.5 HP.',
    benefit_amount: 'Up to 90% Capital Subsidy (Max ₹3,50,000)',
    benefits: [
      '60% to 90% financial subsidy on 3HP to 7.5HP solar pumps',
      'Uninterrupted daytime irrigation without grid electricity costs',
      'Zero diesel fuel expenditure for off-grid farmers'
    ],
    eligibility_criteria: [
      'Individual farmers, Water User Associations, and FPOs',
      'Cultivable land with verified water source (borewell/well)',
      'No existing grid-connected electric pump connection'
    ],
    required_documents: ['Aadhaar Card', 'Land RTC / Mutation copy', 'Water Source Certificate', 'Bank Account details'],
    official_source_url: 'https://pmkusum.mnre.gov.in',
    application_url: 'https://pmkusum.mnre.gov.in',
    domain: 'pmkusum.mnre.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=mnre.gov.in&sz=64'
  },
  {
    id: 'kcc-loan-007',
    name: 'Kisan Credit Card (KCC) 4% Concessional Crop Loan',
    category: 'Credit Support & Kisan Loans',
    state: 'Central',
    short_description: 'Short-term crop cultivation loan up to ₹3 Lakh at an effective concessional interest rate of 4%.',
    description: 'Provides institutional credit to farmers for crop cultivation, post-harvest expenses, and maintenance of farm assets.',
    benefit_amount: 'Collateral-free loan up to ₹1.6 Lakh (₹3 Lakh max at 4%)',
    benefits: [
      '7% baseline interest rate with 3% prompt repayment incentive, reducing effective rate to 4%',
      'No collateral needed for loans up to ₹1,60,000',
      'Flexible repayment aligned with crop harvesting cycle'
    ],
    eligibility_criteria: [
      'All farmers – individuals/joint borrowers who are owner cultivators',
      'Tenant farmers, oral lessees, and sharecroppers',
      'SHGs or Joint Liability Groups of farmers'
    ],
    required_documents: ['Application Form', 'Aadhaar & PAN Card', 'Land record / Cultivation certificate', 'Passport photos'],
    official_source_url: 'https://agricoop.nic.in',
    domain: 'agricoop.nic.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=agricoop.nic.in&sz=64'
  },
  {
    id: 'pmksy-drip-008',
    name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop)',
    category: 'Agriculture & Irrigation Subsidies',
    state: 'Central',
    short_description: '55% to 90% financial assistance for micro-irrigation systems (drip and sprinkler).',
    description: 'Promotes micro-irrigation technologies to enhance water use efficiency and farm productivity for precision agriculture.',
    benefit_amount: '55% to 90% Subsidy on Drip & Sprinkler Units',
    benefits: [
      '55% subsidy for small and marginal farmers, 45% for other farmers',
      'State top-up in Karnataka extends assistance up to 90%',
      'Saves up to 40% irrigation water and increases crop yield by 30%'
    ],
    eligibility_criteria: [
      'All categories of farmers with cultivable land and assured water source',
      'Preference given to SC/ST and women farmers'
    ],
    required_documents: ['Land RTC / Pahani', 'Aadhaar Card', 'Soil & Water Testing Report', 'Bank Passbook'],
    official_source_url: 'https://pmksy.gov.in',
    domain: 'pmksy.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=pmksy.gov.in&sz=64'
  },
  {
    id: 'pmfby-crop-003',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY Crop Insurance)',
    category: 'Crop Insurance & Subsidies',
    state: 'Central',
    short_description: 'Comprehensive risk coverage against crop loss due to non-preventable natural risks at 1.5% to 2% premium.',
    description: 'Provides financial support to farmers suffering crop loss/damage arising out of natural calamities like drought, flood, pests, and unseasonal rains.',
    benefit_amount: 'Full Sum Insured Claim Settlement for Crop Failure',
    benefits: [
      'Nominal premium: 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops',
      'Direct claim settlement via Aadhaar-linked DBT account',
      'Covers prevented sowing, mid-season adversity, and post-harvest localized losses'
    ],
    eligibility_criteria: ['All farmers growing notified crops in notified areas'],
    required_documents: ['Aadhaar Card', 'Land RTC / Pahani', 'Sowing Certificate', 'Bank Passbook'],
    official_source_url: 'https://pmfby.gov.in',
    domain: 'pmfby.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=pmfby.gov.in&sz=64'
  },
  {
    id: 'pmay-g-002',
    name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    category: 'Rural Housing & Infrastructure',
    state: 'Central',
    short_description: 'Financial assistance of ₹1.20 Lakh to ₹1.30 Lakh for construction of pucca house in rural areas.',
    description: 'Aims to provide pucca houses with basic amenities to all rural families living in kutcha or dilapidated houses.',
    benefit_amount: '₹1,20,000 (Plain) / ₹1,30,000 (Hilly)',
    benefits: [
      'Direct grant of ₹1.2 Lakh in plain areas, ₹1.3 Lakh in hilly areas',
      'Additional 90/95 days of unskilled labor wage under MGNREGS',
      '₹12,000 assistance for toilet construction under Swachh Bharat Mission'
    ],
    eligibility_criteria: [
      'Families without shelter or living in kutcha houses',
      'Verified in SECC / Awas+ rural housing list'
    ],
    required_documents: ['Aadhaar Card', 'Bank Account details', 'Job Card Number (MGNREGA)', 'Consent for Aadhaar use'],
    official_source_url: 'https://pmayg.nic.in',
    domain: 'pmayg.nic.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=pmayg.nic.in&sz=64'
  },
  {
    id: 'pm-jay-004',
    name: 'Ayushman Bharat PM-JAY (₹5 Lakh Free Health Cover)',
    category: 'Health & Social Welfare',
    state: 'Central',
    short_description: 'Cashless secondary and tertiary hospitalization cover of up to ₹5 Lakh per family per year.',
    description: 'World largest health assurance scheme providing free secondary and tertiary inpatient care across 27,000+ empaneled hospitals.',
    benefit_amount: '₹5,00,000 / year Cashless Hospitalization',
    benefits: [
      '₹5 Lakh cashless treatment cover per family per year',
      'Covers 1,949 medical procedures including surgeries, ICU, diagnostics, and medicines',
      'No family size or age limit restriction'
    ],
    eligibility_criteria: ['Households identified under SECC 2011 criteria or active BPL / Ration card holders'],
    required_documents: ['Aadhaar Card', 'Ration Card (BPL / Antyodaya)', 'Active Mobile Number'],
    official_source_url: 'https://pmjay.gov.in',
    domain: 'pmjay.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=nha.gov.in&sz=64'
  },
  {
    id: 'smam-mechanization-009',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM - Tractor Subsidy)',
    category: 'Agricultural Machinery & Subsidies',
    state: 'Central',
    short_description: '40% to 50% financial subsidy on purchase of tractors, rotavators, power tillers, and farm machinery.',
    description: 'Promotes agricultural mechanization among small and marginal farmers to offset high labor costs and increase farm productivity.',
    benefit_amount: '40% to 50% Subsidy on Farm Equipment (Up to ₹2,50,000)',
    benefits: [
      '50% subsidy for SC/ST, women, and small/marginal farmers; 40% for general farmers',
      'Covers tractors, power tillers, reapers, seed drills, and sprayers',
      'Direct subsidy credit through DBT'
    ],
    eligibility_criteria: ['Landholding farmers registered in state database'],
    required_documents: ['Aadhaar Card', 'Land RTC / Pahani', 'Bank Passbook', 'Equipment Quotation'],
    official_source_url: 'https://agrimachinery.nic.in',
    domain: 'agrimachinery.nic.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=agricoop.nic.in&sz=64'
  },
  {
    id: 'pkvy-organic-010',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)',
    category: 'Organic Farming & Soil Health',
    state: 'Central',
    short_description: 'Financial assistance of ₹50,000 per hectare for 3 years to adopt certified organic farming clusters.',
    description: 'Promotes chemical-free organic farming through cluster approach with Participatory Guarantee System (PGS) certification.',
    benefit_amount: '₹50,000 / hectare / 3 years',
    benefits: [
      '₹31,000/ha transferred directly via DBT for organic seeds and bio-fertilizers',
      '₹8,800/ha for post-harvest packaging, branding, and marketing',
      'Free PGS-India organic certification'
    ],
    eligibility_criteria: ['Farmers forming organic clusters of minimum 20 hectares / 50 farmers'],
    required_documents: ['Aadhaar Card', 'Land Record (RTC / Pahani)', 'Bank Passbook'],
    official_source_url: 'https://pgsindia-ncof.gov.in',
    domain: 'gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=gov.in&sz=64'
  },
  {
    id: 'raitha-vidya-005',
    name: 'Karnataka Raitha Vidya Nidhi Scholarship',
    category: 'Education & Scholarships',
    state: 'Karnataka',
    short_description: 'Annual educational scholarship of ₹2,500 to ₹11,000 for children of farmers in Karnataka.',
    description: 'Provides annual scholarship directly to bank accounts of farmer children pursuing higher education after 10th standard.',
    benefit_amount: '₹2,500 to ₹11,000 / year based on course',
    benefits: [
      'Direct DBT scholarship into student bank account',
      'Covers PUC, ITI, Diploma, Degree, Postgraduate, and Professional medical/engineering degrees',
      'Female students receive additional incentive amount'
    ],
    eligibility_criteria: [
      'Child of a registered farmer in Karnataka with valid FID / RTC',
      'Enrolled in recognized institution after SSLC / 10th class'
    ],
    required_documents: ['Farmer FID Number', 'Student Aadhaar', 'College Admission Fee Receipt', 'Bank Account details'],
    official_source_url: 'https://raitamitra.karnataka.gov.in',
    domain: 'karnataka.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64'
  },
  {
    id: 'ganga-kalyana-013',
    name: 'Karnataka Ganga Kalyana Scheme (Free Borewell & Pump)',
    category: 'Agriculture & Irrigation Subsidies',
    state: 'Karnataka',
    short_description: '100% free borewell drilling and pump energization for SC, ST, OBC, and Minority small farmers.',
    description: 'Provides dedicated irrigation facilities to small and marginal farmers belonging to backward classes by drilling borewells and energizing power connections with 100% subsidy.',
    benefit_amount: '100% Free Borewell + Pump (Value ₹3.5 Lakh to ₹4.5 Lakh)',
    benefits: [
      '100% financial subsidy on borewell drilling, casing pipe, and pump installation',
      'Free dedicated electric line connection through ESCOM',
      'Transforms dry land into assured irrigated agricultural land'
    ],
    eligibility_criteria: ['Small/marginal farmer belonging to SC/ST/OBC/Minority community with 1.20 to 5.00 acres land'],
    required_documents: ['Land RTC / Pahani', 'Caste & Income Certificate', 'Aadhaar Card', 'Bank Passbook'],
    official_source_url: 'https://kmdc.karnataka.gov.in',
    domain: 'karnataka.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64'
  },
  {
    id: 'krishi-bhagya-014',
    name: 'Karnataka Krishi Bhagya Scheme (Farm Ponds & Polyhouses)',
    category: 'Water Harvesting & Agriculture',
    state: 'Karnataka',
    short_description: 'Up to 90% subsidy for constructing farm ponds (Krishi Honda), polythene lining, diesel pump sets, and shade nets.',
    description: 'Rainwater harvesting and dryland farming initiative providing subsidized farm ponds (Krishi Honda) with polythene lining.',
    benefit_amount: '80% to 90% Subsidy on Farm Pond & Micro-irrigation',
    benefits: [
      '90% subsidy for SC/ST farmers, 80% for general farmers',
      'Covers pond digging, polythene sheet lining, diesel pumpset, and micro-sprinklers'
    ],
    eligibility_criteria: ['Farmers in notified rain-fed taluks of Karnataka with minimum 1 acre land'],
    required_documents: ['Farmer FID / RTC', 'Aadhaar Card', 'Caste & Income Certificate', 'Bank Passbook'],
    official_source_url: 'https://raitamitra.karnataka.gov.in',
    domain: 'karnataka.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64'
  },
  {
    id: 'yashaswini-health-015',
    name: 'Karnataka Yashaswini Health Insurance Scheme',
    category: 'Health & Social Welfare',
    state: 'Karnataka',
    short_description: 'Cashless health insurance cover up to ₹5 Lakh for members of rural cooperative societies in Karnataka.',
    description: 'Health protection scheme covering 1,650+ surgical procedures cashless at network hospitals for cooperative society members.',
    benefit_amount: '₹5,00,000 / year Cashless Treatment',
    benefits: [
      'Cashless treatment up to ₹5 Lakh per family per year',
      'Covers 1,650 surgical and inpatient medical procedures'
    ],
    eligibility_criteria: ['Active member of a registered Rural Cooperative Society in Karnataka'],
    required_documents: ['Cooperative Membership Certificate', 'Aadhaar Card', 'Ration Card', 'Bank Passbook'],
    official_source_url: 'https://yashaswini.karnataka.gov.in',
    domain: 'karnataka.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64'
  },
  {
    id: 'gruha-lakshmi-016',
    name: 'Karnataka Gruha Lakshmi Scheme (₹2,000 Monthly Woman Head)',
    category: 'Women & Child Welfare',
    state: 'Karnataka',
    short_description: 'Direct financial assistance of ₹2,000 per month to the woman head of household in Karnataka.',
    description: 'Flagship DBT guarantee scheme providing unconditional monthly financial assistance of ₹2,000 directly into bank accounts of women heads.',
    benefit_amount: '₹2,000 / month (₹24,000 / year DBT)',
    benefits: [
      'Direct monthly DBT transfer of ₹2,000 into woman Aadhaar-seeded bank account',
      'Improves household economic resilience'
    ],
    eligibility_criteria: ['Woman recognized as Head of Family in valid Ration Card'],
    required_documents: ['Aadhaar Card of Woman Head', 'Husband Aadhaar Card', 'Ration Card', 'NPCI Bank Passbook'],
    official_source_url: 'https://sevasindhu.karnataka.gov.in',
    domain: 'karnataka.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64'
  },
  {
    id: 'pm-vishwakarma-017',
    name: 'PM Vishwakarma Scheme (Artisans & Craftsmen Support)',
    category: 'Artisans & Micro Enterprises',
    state: 'Central',
    short_description: 'Skill training with ₹500/day stipend, ₹15,000 toolkit voucher, and collateral-free loans up to ₹3 Lakh at 5% interest.',
    description: 'Central initiative to support traditional artisans and craftspeople working across 18 trades.',
    benefit_amount: '₹15,000 Toolkit Grant + ₹3 Lakh Loan @ 5%',
    benefits: [
      '₹15,000 e-voucher for modern toolkits',
      'Collateral-free credit up to ₹3 Lakh at concessional 5% interest rate',
      'Skill training with ₹500/day stipend'
    ],
    eligibility_criteria: ['Traditional artisan or craftsman in notified trades'],
    required_documents: ['Aadhaar Card', 'Bank Passbook', 'Ration Card', 'Trade Declaration'],
    official_source_url: 'https://pmvishwakarma.gov.in',
    domain: 'pmvishwakarma.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=msme.gov.in&sz=64'
  },
  {
    id: 'pm-svanidhi-018',
    name: 'PM SVANidhi Scheme (Micro-Credit for Street Vendors)',
    category: 'Micro Credit & Livelihoods',
    state: 'Central',
    short_description: 'Working capital micro-loans of ₹10,000, ₹20,000, and ₹50,000 with 7% interest subsidy for street vendors.',
    description: 'Special micro-credit facility providing collateral-free working capital loans to street vendors.',
    benefit_amount: 'Up to ₹50,000 Working Capital Loan @ 7% Interest Subsidy',
    benefits: [
      'Collateral-free credit: ₹10,000, ₹20,000, and ₹50,000',
      '7% annual interest subsidy credited directly to bank account'
    ],
    eligibility_criteria: ['Street vendors in urban and peri-urban areas'],
    required_documents: ['Aadhaar Card', 'Certificate of Vending / ULB Letter', 'Bank Passbook'],
    official_source_url: 'https://pmsvanidhi.mohua.gov.in',
    domain: 'pmsvanidhi.mohua.gov.in',
    favicon_url: 'https://www.google.com/s2/favicons?domain=mohua.gov.in&sz=64'
  }
];

/**
 * Get popular/active government schemes with multi-tiered fallback
 */
export async function getPopularSchemes(): Promise<SchemeData[]> {
  try {
    const response = await apiClient.get<SchemeData[]>('/api/v1/schemes/popular');
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (e) {
    // Fallback to eligibility schemes
  }

  try {
    const response = await apiClient.get<SchemeData[]>('/api/v1/eligibility/schemes');
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (e) {
    // Fallback to static
  }

  return FALLBACK_VERIFIED_SCHEMES;
}

/**
 * Get single scheme details by ID with dynamic live discovery fallback
 */
export async function getSchemeById(schemeId: string): Promise<SchemeData | null> {
  if (!schemeId) return null;

  // 1. Check direct backend endpoint
  try {
    const response = await apiClient.get<SchemeData>(`/api/v1/schemes/${schemeId}`);
    if (response.data && response.data.id) return response.data;
  } catch (e) {
    // Ignore and proceed to next layer
  }

  // 2. Check local verified dataset
  const idClean = schemeId.toLowerCase().trim();
  const foundLocal = FALLBACK_VERIFIED_SCHEMES.find(
    (s) => s.id.toLowerCase() === idClean || s.name.toLowerCase().includes(idClean.replace(/-/g, ' '))
  );
  if (foundLocal) return foundLocal;

  // 3. Check MongoDB Search History
  try {
    const histRes = await apiClient.get<{ success: boolean; history: SchemeSearchHistoryItem[] }>(
      '/api/v1/schemes/history',
      { params: { limit: 30 } }
    );
    if (histRes.data?.history) {
      for (const h of histRes.data.history) {
        const foundInHist = (h.schemes || []).find(
          (s) => s.id?.toLowerCase() === idClean || s.name?.toLowerCase().includes(idClean.replace(/-/g, ' '))
        );
        if (foundInHist) return foundInHist;
      }
    }
  } catch (e) {
    // Continue to live search
  }

  // 4. Live Tavily & Groq Discovery Fallback
  try {
    const query = schemeId.replace(/[-_]/g, ' ');
    const searchRes = await searchSchemesRealtime(query, undefined, 'en');
    if (searchRes.schemes && searchRes.schemes.length > 0) {
      return searchRes.schemes[0];
    }
  } catch (e) {
    console.warn(`Dynamic scheme lookup failed for '${schemeId}':`, e);
  }

  return null;
}

export async function searchSchemesRealtime(
  query: string,
  state?: string,
  language: string = 'en',
  userId?: string
): Promise<RealtimeSearchResponse> {
  const response = await apiClient.post<RealtimeSearchResponse>(
    '/api/v1/schemes/search-realtime',
    {
      query,
      state: state || undefined,
      language,
      max_results: 6,
      user_id: userId || 'citizen',
    }
  );
  return response.data;
}

/**
 * Get Citizen Scheme Search History from MongoDB
 */
export async function getSchemeSearchHistory(
  userId?: string,
  limit: number = 30
): Promise<{ success: boolean; count: number; history: SchemeSearchHistoryItem[] }> {
  const response = await apiClient.get<{ success: boolean; count: number; history: SchemeSearchHistoryItem[] }>(
    '/api/v1/schemes/history',
    {
      params: { user_id: userId, limit },
    }
  );
  return response.data;
}

/**
 * Get Specific Scheme Search Record by ID
 */
export async function getSchemeSearchHistoryById(
  historyId: string
): Promise<SchemeSearchHistoryItem> {
  const response = await apiClient.get<SchemeSearchHistoryItem>(
    `/api/v1/schemes/history/${historyId}`
  );
  return response.data;
}

/**
 * Delete a Single Scheme Search Record
 */
export async function deleteSchemeSearchHistoryItem(
  historyId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/api/v1/schemes/history/${historyId}`
  );
  return response.data;
}

/**
 * Clear All Scheme Search History for User
 */
export async function clearSchemeSearchHistory(
  userId?: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    '/api/v1/schemes/history',
    {
      params: { user_id: userId },
    }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Authentication & Farmer Media API Types & Services
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
  is_verified: boolean;
  is_onboarded?: boolean;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  farm_location_name?: string | null;
  survey_number?: string | null;
  landholding_acres?: number | null;
  irrigated_acres?: number | null;
  soil_type?: string | null;
  water_source?: string | null;
  ownership_status?: string | null;
  primary_crop?: string | null;
  secondary_crops?: string | null;
  farming_type?: string | null;
  machinery_owned?: string | null;
  livestock_details?: string | null;
  annual_income?: number | null;
  caste_category?: string | null;
  special_category?: string | null;
  aadhaar_dbt_linked?: boolean | null;
  pm_kisan_registered?: boolean | null;
  kcc_card_active?: boolean | null;
  crop_insurance_active?: boolean | null;
  soil_health_card_issued?: boolean | null;
  bio?: string | null;
  avatar_url?: string | null;
  land_images?: string[] | null;
  document_images?: string[] | null;
  created_at?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
  message: string;
}

export interface GenericAuthMsg {
  success: boolean;
  message: string;
  email?: string;
}

// Attach JWT token automatically to outgoing requests if available
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('gramsetu_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export async function authSignUp(data: {
  name: string;
  email: string;
  handle: string;
  password: string;
}): Promise<GenericAuthMsg> {
  const res = await apiClient.post<GenericAuthMsg>('/api/v1/auth/signup', data);
  return res.data;
}

export async function authVerifyOtp(data: {
  email: string;
  otp: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/verify-otp', data);
  if (res.data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('gramsetu_jwt_token', res.data.access_token);
  }
  return res.data;
}

export async function authResendOtp(
  email: string,
  otpType: 'signup' | 'reset' = 'signup'
): Promise<GenericAuthMsg> {
  const res = await apiClient.post<GenericAuthMsg>('/api/v1/auth/resend-otp', {
    email,
    otp_type: otpType,
  });
  return res.data;
}

export async function authLogin(data: {
  login_identifier: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
  if (res.data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('gramsetu_jwt_token', res.data.access_token);
  }
  return res.data;
}

export async function authForgotPassword(email: string): Promise<GenericAuthMsg> {
  const res = await apiClient.post<GenericAuthMsg>('/api/v1/auth/forgot-password', {
    email,
  });
  return res.data;
}

export async function authResetPassword(data: {
  email: string;
  otp: string;
  new_password: string;
}): Promise<GenericAuthMsg> {
  const res = await apiClient.post<GenericAuthMsg>('/api/v1/auth/reset-password', data);
  return res.data;
}

export async function authGetMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/api/v1/auth/me');
  return res.data;
}

export async function authUpdateProfile(
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await apiClient.put<UserProfile>('/api/v1/auth/profile', data);
  return res.data;
}

// ------------------------------------------------------------------
// Vani-Bot Conversation Archives & AI Summaries API
// ------------------------------------------------------------------
export interface VaniConversationRecord {
  id: string;
  user_id?: string | null;
  session_id: string;
  title: string;
  language: string;
  query_text: string;
  response_text: string;
  audio_url?: string | null;
  ai_summary?: string | null;
  schemes_matched?: Array<{
    scheme_id?: string;
    scheme_name?: string;
    benefit_amount?: string;
    match_score?: number;
  }>;
  detected_intent?: string | null;
  duration_seconds?: number;
  turns?: Array<{
    turn?: number;
    speaker?: string;
    text?: string;
    timestamp?: string;
  }>;
  created_at?: string;
}

export interface SaveVaniConversationPayload {
  user_id?: string;
  session_id: string;
  title?: string;
  language?: string;
  query_text: string;
  response_text: string;
  audio_url?: string;
  ai_summary?: string;
  schemes_matched?: Array<any>;
  detected_intent?: string;
  duration_seconds?: number;
  turns?: Array<any>;
}

export async function saveVaniConversation(
  payload: SaveVaniConversationPayload
): Promise<VaniConversationRecord> {
  const res = await apiClient.post<VaniConversationRecord>('/api/v1/vanibot/history', payload);
  return res.data;
}

export async function getVaniHistory(
  userId?: string,
  sessionId?: string
): Promise<VaniConversationRecord[]> {
  const params: Record<string, string> = {};
  if (userId) params.user_id = userId;
  if (sessionId) params.session_id = sessionId;
  const res = await apiClient.get<VaniConversationRecord[]>('/api/v1/vanibot/history', { params });
  return res.data;
}

export async function getVaniHistoryById(id: string): Promise<VaniConversationRecord> {
  const res = await apiClient.get<VaniConversationRecord>(`/api/v1/vanibot/history/${id}`);
  return res.data;
}

export async function deleteVaniHistoryById(id: string): Promise<{ status: string; deleted: boolean }> {
  const res = await apiClient.delete<{ status: string; deleted: boolean }>(`/api/v1/vanibot/history/${id}`);
  return res.data;
}

// ==========================================
// 10. NITI RAG GAZETTE VECTOR ENGINE APIS
// ==========================================

export interface NitiragDocumentRecord {
  id: string;
  title: string;
  state: string;
  department: string;
  category: string;
  gazette_number?: string;
  pdf_url: string;
  file_name: string;
  file_size_bytes: number;
  total_pages: number;
  total_chunks: number;
  embedding_model_used: string;
  status: string;
  uploaded_by: string;
  created_at: string;
  summary?: string;
}

export interface NitiragChunkRecord {
  id: string;
  document_id: string;
  document_title: string;
  state: string;
  department: string;
  page_number: number;
  chunk_index: number;
  text: string;
  embedding_model: string;
  created_at: string;
}

export interface UploadGazetteResponse {
  success: boolean;
  message: string;
  document: NitiragDocumentRecord;
  chunks_created: number;
  embedding_model: string;
}

export interface NitiragDocumentListResponse {
  total: number;
  documents: NitiragDocumentRecord[];
}

export interface NitiragModelInfo {
  active_models: string[];
  total_gemini_keys: number;
  current_key_preview?: string;
  status: string;
}

export interface NitiragCitation {
  document_id: string;
  document_title: string;
  gazette_number?: string;
  page_number: number;
  chunk_text: string;
  pdf_url: string;
  relevance_score: number;
  source_type?: 'vector_gazette' | 'web_search';
  domain?: string;
  favicon_url?: string;
}

export interface NitiragQueryRequest {
  query: string;
  state?: string;
  department?: string;
  selected_document_ids?: string[];
  enable_web_search?: boolean;
  top_k?: number;
  language?: string;
  citizen_profile?: CitizenProfile;
}

export interface NitiragQueryResponse {
  query: string;
  answer: string;
  citations: NitiragCitation[];
  confidence_score: number;
  model_used: string;
  execution_time_ms: number;
}

export async function uploadGazettePdf(
  file: File,
  metadata?: {
    title?: string;
    state?: string;
    department?: string;
    category?: string;
    gazette_number?: string;
    user_id?: string;
  }
): Promise<UploadGazetteResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata?.title) formData.append('title', metadata.title);
  if (metadata?.state) formData.append('state', metadata.state);
  if (metadata?.department) formData.append('department', metadata.department);
  if (metadata?.category) formData.append('category', metadata.category);
  if (metadata?.gazette_number) formData.append('gazette_number', metadata.gazette_number);
  if (metadata?.user_id) formData.append('user_id', metadata.user_id);

  const res = await apiClient.post<UploadGazetteResponse>('/api/v1/nitirag/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function getNitiragDocuments(
  state?: string,
  department?: string,
  query?: string
): Promise<NitiragDocumentListResponse> {
  const params: Record<string, string> = {};
  if (state) params.state = state;
  if (department) params.department = department;
  if (query) params.query = query;

  const res = await apiClient.get<NitiragDocumentListResponse>('/api/v1/nitirag/documents', { params });
  return res.data;
}

export async function getNitiragDocumentById(id: string): Promise<{ document: NitiragDocumentRecord; chunks: NitiragChunkRecord[] }> {
  const res = await apiClient.get<{ document: NitiragDocumentRecord; chunks: NitiragChunkRecord[] }>(`/api/v1/nitirag/documents/${id}`);
  return res.data;
}

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations: NitiragCitation[];
  created_at: string;
}

export interface NitiragConversationRecord {
  id: string;
  session_id: string;
  title: string;
  user_id: string;
  selected_document_ids: string[];
  selected_document_titles: string[];
  messages: ChatMessageRecord[];
  is_archived?: boolean;
  enable_web_search?: boolean;
  created_at: string;
  updated_at: string;
}

export async function updateNitiragDocument(
  id: string,
  updates: Partial<NitiragDocumentRecord>
): Promise<NitiragDocumentRecord> {
  const res = await apiClient.patch<NitiragDocumentRecord>(`/api/v1/nitirag/documents/${id}`, updates);
  return res.data;
}

export async function getNitiragConversations(userId?: string): Promise<NitiragConversationRecord[]> {
  const params: Record<string, string> = {};
  if (userId) params.user_id = userId;
  const res = await apiClient.get<NitiragConversationRecord[]>('/api/v1/nitirag/conversations', { params });
  return res.data;
}

export async function createNitiragConversation(
  title: string = 'New Legal Consultation',
  selectedDocumentIds: string[] = [],
  enableWebSearch: boolean = false,
  userId?: string
): Promise<NitiragConversationRecord> {
  const res = await apiClient.post<NitiragConversationRecord>('/api/v1/nitirag/conversations', {
    title,
    selected_document_ids: selectedDocumentIds,
    enable_web_search: enableWebSearch,
    user_id: userId,
  });
  return res.data;
}

export async function getNitiragConversationById(id: string): Promise<NitiragConversationRecord> {
  const res = await apiClient.get<NitiragConversationRecord>(`/api/v1/nitirag/conversations/${id}`);
  return res.data;
}

export async function updateNitiragConversation(
  id: string,
  updates: { title?: string; selected_document_ids?: string[]; is_archived?: boolean; enable_web_search?: boolean }
): Promise<NitiragConversationRecord> {
  const res = await apiClient.patch<NitiragConversationRecord>(`/api/v1/nitirag/conversations/${id}`, updates);
  return res.data;
}

export async function deleteNitiragConversation(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/nitirag/conversations/${id}`);
  return res.data;
}

export async function summarizeAndForkNitiragConversation(
  conversationId: string,
  userId?: string
): Promise<NitiragConversationRecord> {
  const res = await apiClient.post<NitiragConversationRecord>('/api/v1/nitirag/conversations/summarize-fork', {
    conversation_id: conversationId,
    user_id: userId,
  });
  return res.data;
}

export async function executeNitiragChatTurn(payload: {
  conversation_id?: string;
  query: string;
  selected_document_ids?: string[];
  enable_web_search?: boolean;
  language?: string;
  state?: string;
  user_id?: string;
}): Promise<NitiragConversationRecord> {
  const res = await apiClient.post<NitiragConversationRecord>('/api/v1/nitirag/chat', payload);
  return res.data;
}

export async function deleteNitiragDocument(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/nitirag/documents/${id}`);
  return res.data;
}

export async function getNitiragModelInfo(): Promise<NitiragModelInfo> {
  const res = await apiClient.get<NitiragModelInfo>('/api/v1/nitirag/models');
  return res.data;
}

export async function queryNitiRag(payload: NitiragQueryRequest): Promise<NitiragQueryResponse> {
  const res = await apiClient.post<NitiragQueryResponse>('/api/v1/nitirag/query', payload);
  return res.data;
}

// -------------------------------------------------------------
// KISAN CHAUPAL: SOCIAL MEDIA & KRISHI MARKETPLACE INTERFACES
// -------------------------------------------------------------

export interface ChaupalAuthor {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string;
  village: string;
  is_verified?: boolean;
  badge?: string;
}

export interface ChaupalComment {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  text: string;
  created_at: string;
}

export interface ChaupalPost {
  id: string;
  author: ChaupalAuthor;
  media_urls: string[];
  media_type?: string;
  caption: string;
  topic?: string;
  crop_tag?: string;
  farming_stage?: string;
  farming_practice?: string;
  observed_yield?: string;
  location?: string;
  hashtags?: string[];
  likes_count: number;
  likes_users: string[];
  comments: ChaupalComment[];
  created_at: string;
}

export interface ChaupalStory {
  id: string;
  user_id: string;
  username: string;
  name: string;
  avatar_url: string;
  village?: string;
  media_url: string;
  media_type?: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  views_count: number;
}

export interface ChaupalStoryGroup {
  user_id: string;
  username: string;
  name: string;
  avatar_url: string;
  village?: string;
  stories: ChaupalStory[];
}

export interface ChaupalMarketplaceItem {
  id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: string;
  min_order?: string;
  variety?: string;
  grade?: string;
  moisture_content?: string;
  packaging_type?: string;
  delivery_mode?: string;
  negotiation_terms?: string;
  payment_terms?: string;
  location: string;
  state?: string;
  images: string[];
  seller: {
    user_id: string;
    name: string;
    username: string;
    phone: string;
    whatsapp: string;
    village: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  description: string;
  organic_certified?: boolean;
  harvest_date?: string;
  status: string;
  created_at: string;
}

export interface ChaupalFarmerProfile {
  username: string;
  name: string;
  avatar_url: string;
  banner_url?: string;
  village: string;
  state: string;
  bio: string;
  primary_crops: string[];
  landholding_acres: number;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  marketplace_count: number;
  posts: ChaupalPost[];
  marketplace_items: ChaupalMarketplaceItem[];
}

/**
 * Get active stories grouped by farmer
 */
export async function getChaupalStories(): Promise<{ success: boolean; count: number; story_groups: ChaupalStoryGroup[] }> {
  const res = await apiClient.get<{ success: boolean; count: number; story_groups: ChaupalStoryGroup[] }>('/api/v1/chaupal/stories');
  return res.data;
}

/**
 * Create a new 24h story with Cloudinary media
 */
export async function createChaupalStory(payload: {
  media_url: string;
  media_type?: string;
  caption?: string;
  user_id?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  village?: string;
}): Promise<{ success: boolean; story: ChaupalStory }> {
  const res = await apiClient.post<{ success: boolean; story: ChaupalStory }>('/api/v1/chaupal/stories', payload);
  return res.data;
}

/**
 * Update story caption
 */
export async function updateChaupalStory(storyId: string, payload: {
  caption?: string;
  media_url?: string;
}): Promise<{ success: boolean; story: ChaupalStory }> {
  const res = await apiClient.put<{ success: boolean; story: ChaupalStory }>(`/api/v1/chaupal/stories/${storyId}`, payload);
  return res.data;
}

/**
 * Delete a story
 */
export async function deleteChaupalStory(storyId: string, username?: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/chaupal/stories/${storyId}`, {
    params: { username }
  });
  return res.data;
}

/**
 * Get Kisan Chaupal feed posts
 */
export async function getChaupalPosts(params?: {
  tag?: string;
  username?: string;
  limit?: number;
  skip?: number;
}): Promise<{ success: boolean; count: number; posts: ChaupalPost[] }> {
  const res = await apiClient.get<{ success: boolean; count: number; posts: ChaupalPost[] }>('/api/v1/chaupal/posts', { params });
  return res.data;
}

/**
 * Create a new feed post with Cloudinary photos
 */
export async function createChaupalPost(payload: {
  caption: string;
  media_urls: string[];
  media_type?: string;
  topic?: string;
  crop_tag?: string;
  farming_stage?: string;
  farming_practice?: string;
  observed_yield?: string;
  location?: string;
  user_id?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  village?: string;
}): Promise<{ success: boolean; post: ChaupalPost }> {
  const res = await apiClient.post<{ success: boolean; post: ChaupalPost }>('/api/v1/chaupal/posts', payload);
  return res.data;
}

/**
 * Update an existing post
 */
export async function updateChaupalPost(postId: string, payload: {
  caption?: string;
  topic?: string;
  crop_tag?: string;
  farming_stage?: string;
  farming_practice?: string;
  observed_yield?: string;
  location?: string;
  media_urls?: string[];
}): Promise<{ success: boolean; post: ChaupalPost }> {
  const res = await apiClient.put<{ success: boolean; post: ChaupalPost }>(`/api/v1/chaupal/posts/${postId}`, payload);
  return res.data;
}

/**
 * Delete a post
 */
export async function deleteChaupalPost(postId: string, username?: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/chaupal/posts/${postId}`, {
    params: { username }
  });
  return res.data;
}

/**
 * Toggle like on a post
 */
export async function toggleChaupalPostLike(postId: string, userId: string = 'citizen_farmer'): Promise<{
  liked: boolean;
  likes_count: number;
}> {
  const res = await apiClient.post<{ success: boolean; liked: boolean; likes_count: number }>(`/api/v1/chaupal/posts/${postId}/like`, { user_id: userId });
  return res.data;
}

/**
 * Add comment to a post
 */
export async function addChaupalPostComment(postId: string, payload: {
  text: string;
  username?: string;
  name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; comment: ChaupalComment }> {
  const res = await apiClient.post<{ success: boolean; comment: ChaupalComment }>(`/api/v1/chaupal/posts/${postId}/comment`, payload);
  return res.data;
}

/**
 * Get single post by ID
 */
export async function getChaupalPost(postId: string): Promise<{ success: boolean; post: ChaupalPost }> {
  const res = await apiClient.get<{ success: boolean; post: ChaupalPost }>(`/api/v1/chaupal/posts/${postId}`);
  return res.data;
}

/**
 * Get Krishi Marketplace listings
 */
export async function getChaupalMarketplace(params?: {
  category?: string;
  query?: string;
  location?: string;
  limit?: number;
}): Promise<{ success: boolean; count: number; items: ChaupalMarketplaceItem[] }> {
  const res = await apiClient.get<{ success: boolean; count: number; items: ChaupalMarketplaceItem[] }>('/api/v1/chaupal/marketplace', { params });
  return res.data;
}

/**
 * Create a new marketplace produce or equipment listing
 */
export async function createChaupalMarketplaceItem(payload: {
  title: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: string;
  min_order?: string;
  variety?: string;
  grade?: string;
  moisture_content?: string;
  packaging_type?: string;
  delivery_mode?: string;
  negotiation_terms?: string;
  payment_terms?: string;
  location: string;
  phone: string;
  description: string;
  images: string[];
  organic_certified?: boolean;
  harvest_date?: string;
  user_id?: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  village?: string;
}): Promise<{ success: boolean; item: ChaupalMarketplaceItem }> {
  const res = await apiClient.post<{ success: boolean; item: ChaupalMarketplaceItem }>('/api/v1/chaupal/marketplace', payload);
  return res.data;
}

/**
 * Get single marketplace item details
 */
export async function getChaupalMarketplaceItem(itemId: string): Promise<{ success: boolean; item: ChaupalMarketplaceItem }> {
  const res = await apiClient.get<{ success: boolean; item: ChaupalMarketplaceItem }>(`/api/v1/chaupal/marketplace/${itemId}`);
  return res.data;
}

/**
 * Update marketplace listing
 */
export async function updateChaupalMarketplaceItem(itemId: string, payload: Partial<ChaupalMarketplaceItem>): Promise<{ success: boolean; item: ChaupalMarketplaceItem }> {
  const res = await apiClient.put<{ success: boolean; item: ChaupalMarketplaceItem }>(`/api/v1/chaupal/marketplace/${itemId}`, payload);
  return res.data;
}

/**
 * Delete marketplace listing
 */
export async function deleteChaupalMarketplaceItem(itemId: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/chaupal/marketplace/${itemId}`);
  return res.data;
}

/**
 * Get farmer social media profile & stats
 */
export async function getChaupalFarmerProfile(username: string): Promise<{ success: boolean; profile: ChaupalFarmerProfile }> {
  const res = await apiClient.get<{ success: boolean; profile: ChaupalFarmerProfile }>(`/api/v1/chaupal/profile/${username}`);
  return res.data;
}

/**
 * Get dynamic agricultural trending hashtags & topics
 */
export async function getChaupalTrending(): Promise<{ success: boolean; trends: Array<{ tag: string; count: string; desc: string }> }> {
  const res = await apiClient.get<{ success: boolean; trends: Array<{ tag: string; count: string; desc: string }> }>('/api/v1/chaupal/trending');
  return res.data;
}

/**
 * Get suggested progressive farmers & official bodies
 */
export async function getChaupalSuggestions(): Promise<{
  success: boolean;
  suggestions: Array<{
    username: string;
    name: string;
    avatar_url: string;
    badge: string;
    village: string;
    is_verified?: boolean;
    is_official?: boolean;
  }>;
}> {
  const res = await apiClient.get<{
    success: boolean;
    suggestions: Array<{
      username: string;
      name: string;
      avatar_url: string;
      badge: string;
      village: string;
      is_verified?: boolean;
      is_official?: boolean;
    }>;
  }>('/api/v1/chaupal/suggestions');
  return res.data;
}

/**
 * React to a post with an emoticon/emoji (❤️, 🌾, 🚜, 🔥, 👏, 🌱)
 */
export async function reactToChaupalPost(postId: string, emoji: string, userId: string = 'citizen_farmer'): Promise<{
  success: boolean;
  reactions: Record<string, number>;
  likes_count: number;
}> {
  const res = await apiClient.post<{
    success: boolean;
    reactions: Record<string, number>;
    likes_count: number;
  }>(`/api/v1/chaupal/posts/${postId}/react`, { emoji, user_id: userId });
  return res.data;
}

/**
 * Reply or react to a 24h story
 */
export async function replyToChaupalStory(storyId: string, payload: {
  text?: string;
  emoji?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; message: string; chat_message?: any }> {
  const res = await apiClient.post<{ success: boolean; message: string; chat_message?: any }>(`/api/v1/chaupal/stories/${storyId}/reply`, payload);
  return res.data;
}

/**
 * Get direct message conversation threads
 */
export async function getChaupalConversations(currentUser: string = 'citizen_farmer'): Promise<{
  success: boolean;
  conversations: Array<{
    other_handle: string;
    other_name: string;
    other_avatar: string;
    last_message: string;
    last_timestamp: string;
    unread_count: number;
  }>;
}> {
  const res = await apiClient.get<{
    success: boolean;
    conversations: Array<{
      other_handle: string;
      other_name: string;
      other_avatar: string;
      last_message: string;
      last_timestamp: string;
      unread_count: number;
    }>;
  }>('/api/v1/chaupal/messages/conversations', { params: { current_user: currentUser } });
  return res.data;
}

/**
 * Get chat history with a specific farmer
 */
export async function getChaupalChatHistory(otherHandle: string, currentUser: string = 'citizen_farmer'): Promise<{
  success: boolean;
  count: number;
  messages: Array<{
    id: string;
    sender_handle: string;
    sender_name: string;
    sender_avatar: string;
    recipient_handle: string;
    text: string;
    image_url?: string;
    story_id?: string;
    story_media_url?: string;
    created_at: string;
    read: boolean;
  }>;
}> {
  const res = await apiClient.get<{
    success: boolean;
    count: number;
    messages: Array<{
      id: string;
      sender_handle: string;
      sender_name: string;
      sender_avatar: string;
      recipient_handle: string;
      text: string;
      image_url?: string;
      story_id?: string;
      story_media_url?: string;
      created_at: string;
      read: boolean;
    }>;
  }>(`/api/v1/chaupal/messages/${otherHandle}`, { params: { current_user: currentUser } });
  return res.data;
}

/**
 * Send direct message to a farmer in real-time
 */
export async function sendChaupalDirectMessage(otherHandle: string, payload: {
  text?: string;
  image_url?: string;
  voice_url?: string;
  voice_duration?: number;
  sender_handle?: string;
  sender_name?: string;
  sender_avatar?: string;
}): Promise<{ success: boolean; message: any }> {
  const res = await apiClient.post<{ success: boolean; message: any }>(`/api/v1/chaupal/messages/${otherHandle}`, payload);
  return res.data;
}

/**
 * Search registered users to start new chat
 */
export async function searchChaupalMessageableUsers(query: string = '', currentUser: string = 'citizen_farmer'): Promise<{
  success: boolean;
  users: Array<{
    username: string;
    name: string;
    avatar_url: string;
    village: string;
    is_verified?: boolean;
  }>;
}> {
  const res = await apiClient.get<{ success: boolean; users: any[] }>('/api/v1/chaupal/messages/users/search', {
    params: { query, current_user: currentUser }
  });
  return res.data;
}

/**
 * Send typing status heartbeat
 */
export async function sendChaupalTypingStatus(otherHandle: string, senderHandle: string, isTyping: boolean = true): Promise<{ success: boolean }> {
  const res = await apiClient.post<{ success: boolean }>(`/api/v1/chaupal/messages/${otherHandle}/typing`, {
    sender_handle: senderHandle,
    is_typing: isTyping
  });
  return res.data;
}

/**
 * Check if other user is currently typing
 */
export async function getChaupalTypingStatus(otherHandle: string, currentUser: string = 'citizen_farmer'): Promise<{ success: boolean; is_typing: boolean }> {
  const res = await apiClient.get<{ success: boolean; is_typing: boolean }>(`/api/v1/chaupal/messages/${otherHandle}/typing`, {
    params: { current_user: currentUser }
  });
  return res.data;
}

/**
 * Toggle archive/unarchive chat
 */
export async function toggleChaupalArchiveChat(otherHandle: string, userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; is_archived: boolean; message: string }> {
  const res = await apiClient.post<{ success: boolean; is_archived: boolean; message: string }>(`/api/v1/chaupal/messages/${otherHandle}/archive`, {
    user_handle: userHandle
  });
  return res.data;
}

/**
 * Get list of archived chat handles
 */
export async function getChaupalArchivedChats(userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; archived_handles: string[] }> {
  const res = await apiClient.get<{ success: boolean; archived_handles: string[] }>('/api/v1/chaupal/messages/archived/list', {
    params: { current_user: userHandle }
  });
  return res.data;
}

/**
 * Toggle block/unblock farmer
 */
export async function toggleChaupalBlockUser(otherHandle: string, userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; is_blocked: boolean; message: string }> {
  const res = await apiClient.post<{ success: boolean; is_blocked: boolean; message: string }>(`/api/v1/chaupal/messages/${otherHandle}/block`, {
    user_handle: userHandle
  });
  return res.data;
}

/**
 * Get list of blocked user handles
 */
export async function getChaupalBlockedUsers(userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; blocked_handles: string[] }> {
  const res = await apiClient.get<{ success: boolean; blocked_handles: string[] }>('/api/v1/chaupal/messages/blocked/list', {
    params: { current_user: userHandle }
  });
  return res.data;
}

/**
 * Clear chat history with a user
 */
export async function clearChaupalChatHistory(otherHandle: string, userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/chaupal/messages/${otherHandle}/clear`, {
    params: { current_user: userHandle }
  });
  return res.data;
}

/**
 * React to a message with an emoji
 */
export async function reactToChaupalMessage(messageId: string, emoji: string, userHandle: string = 'citizen_farmer'): Promise<{ success: boolean; reactions: Record<string, string> }> {
  const res = await apiClient.post<{ success: boolean; reactions: Record<string, string> }>(`/api/v1/chaupal/messages/${messageId}/react`, {
    user_handle: userHandle,
    emoji: emoji
  });
  return res.data;
}

/**
 * Get algorithmic explore feed ranked by engagement
 */
export async function getChaupalExploreFeed(params?: {
  category?: string;
  query?: string;
  limit?: number;
}): Promise<{ success: boolean; count: number; posts: ChaupalPost[] }> {
  const res = await apiClient.get<{ success: boolean; count: number; posts: ChaupalPost[] }>('/api/v1/chaupal/explore', { params });
  return res.data;
}

/**
 * Toggle follow farmer
 */
export async function toggleChaupalFollow(username: string, userId: string = 'current_user'): Promise<{ success: boolean; following: boolean; followers_count: number; message: string }> {
  const res = await apiClient.post<{ success: boolean; following: boolean; followers_count: number; message: string }>(`/api/v1/chaupal/profile/${username}/follow`, { user_id: userId, username: userId });
  return res.data;
}

/**
 * Update current user farmer profile (bio, avatar, name, village)
 */
export async function updateChaupalMyProfile(payload: {
  username?: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  village?: string;
  district?: string;
  primary_crops?: string[];
}): Promise<{ success: boolean; message: string; updates: any }> {
  const res = await apiClient.put<{ success: boolean; message: string; updates: any }>('/api/v1/chaupal/profile/me', payload);
  return res.data;
}

export interface ChaupalFollowUser {
  username: string;
  name: string;
  avatar_url: string;
  village: string;
  is_verified?: boolean;
  is_official?: boolean;
  is_following?: boolean;
}

/**
 * Get followers list for a user
 */
export async function getChaupalFollowers(username: string, currentUser: string = 'citizen_farmer'): Promise<{
  success: boolean;
  count: number;
  followers: ChaupalFollowUser[];
}> {
  const res = await apiClient.get<{ success: boolean; count: number; followers: ChaupalFollowUser[] }>(
    `/api/v1/chaupal/profile/${username}/followers`,
    { params: { current_user: currentUser } }
  );
  return res.data;
}

/**
 * Get following list for a user
 */
export async function getChaupalFollowing(username: string, currentUser: string = 'citizen_farmer'): Promise<{
  success: boolean;
  count: number;
  following: ChaupalFollowUser[];
}> {
  const res = await apiClient.get<{ success: boolean; count: number; following: ChaupalFollowUser[] }>(
    `/api/v1/chaupal/profile/${username}/following`,
    { params: { current_user: currentUser } }
  );
  return res.data;
}

// -------------------------------------------------------------
// KRISHI OPENSTREETMAP & AGRI-GIS INTERFACES & APIS
// -------------------------------------------------------------

export interface AgriGisResource {
  id: string;
  name: string;
  category: 'mandi' | 'chc' | 'soil_lab' | 'cold_storage';
  category_label: string;
  lat: number;
  lng: number;
  state: string;
  district: string;
  address: string;
  contact_phone: string;
  operating_hours: string;
  rating: number;
  distance_km: number;
  estimated_travel_minutes: number;
  estimated_transport_cost_quintal: number;
  crops?: Array<{
    crop: string;
    modal_price: number;
    unit: string;
    trend: string;
    arrival_qtl: number;
  }>;
  equipment?: Array<{
    name: string;
    rate: string;
    availability: string;
  }>;
  services?: Array<{
    test: string;
    fee: string;
    turnaround: string;
  }>;
  storage_info?: {
    total_capacity_mt: number;
    available_capacity_mt: number;
    temperature_range: string;
    charges: string;
    supported_crops: string[];
  };
  facilities: string[];
}

export interface LandParcelCalcResult {
  success: boolean;
  area: {
    sq_meters: number;
    acres: number;
    guntas: number;
    hectares: number;
    bighas: number;
  };
  perimeter: {
    meters: number;
    feet: number;
  };
  vertex_count: number;
}

/**
 * Fetch OpenStreetMap agricultural resources (Mandis, CHCs, Soil Labs, Cold Storage)
 */
export async function getAgriGisResources(params?: {
  lat?: number;
  lng?: number;
  category?: string;
  crop?: string;
}): Promise<{
  success: boolean;
  count: number;
  user_location: { lat: number; lng: number };
  resources: AgriGisResource[];
}> {
  const res = await apiClient.get<{
    success: boolean;
    count: number;
    user_location: { lat: number; lng: number };
    resources: AgriGisResource[];
  }>('/api/v1/agrigis/resources', { params });
  return res.data;
}

/**
 * Find highest paying APMC Mandi for a specific crop with net price realization
 */
export async function getBestMandiForCrop(
  crop: string = 'Tomato',
  lat: number = 12.5226,
  lng: number = 76.8976
): Promise<{
  success: boolean;
  crop: string;
  count: number;
  best_mandi: any;
  all_mandis: any[];
}> {
  const res = await apiClient.get<{
    success: boolean;
    crop: string;
    count: number;
    best_mandi: any;
    all_mandis: any[];
  }>('/api/v1/agrigis/mandi/best-price', {
    params: { crop, lat, lng }
  });
  return res.data;
}

/**
 * Calculate exact farm parcel area (Acres, Guntas, Hectares) from OpenStreetMap polygon vertices
 */
export async function calculateLandParcel(
  coordinates: Array<[number, number]>
): Promise<LandParcelCalcResult> {
  const res = await apiClient.post<LandParcelCalcResult>('/api/v1/agrigis/calculate-parcel', {
    coordinates
  });
  return res.data;
}

export interface ChaupalNotification {
  id: string;
  recipient_handle: string;
  actor_handle: string;
  actor_name: string;
  actor_avatar: string;
  type: 'follow' | 'message' | 'like' | 'comment' | 'story_reply' | 'marketplace' | string;
  text: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get user in-app notifications with unread badge count
 */
export async function getChaupalNotifications(username: string = 'citizen_farmer', limit: number = 30): Promise<{
  success: boolean;
  count: number;
  unread_count: number;
  notifications: ChaupalNotification[];
}> {
  const res = await apiClient.get<{
    success: boolean;
    count: number;
    unread_count: number;
    notifications: ChaupalNotification[];
  }>('/api/v1/chaupal/notifications', { params: { username, limit } });
  return res.data;
}

/**
 * Mark in-app notifications as read
 */
export async function markChaupalNotificationsRead(username: string = 'citizen_farmer', notificationId?: string): Promise<{
  success: boolean;
  marked: number;
}> {
  const res = await apiClient.post<{ success: boolean; marked: number }>('/api/v1/chaupal/notifications/read', {
    username,
    notification_id: notificationId
  });
  return res.data;
}

/**
 * Delete a single in-app notification
 */
export async function deleteChaupalNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/api/v1/chaupal/notifications/${notificationId}`);
  return res.data;
}

export { API_BASE_URL };




