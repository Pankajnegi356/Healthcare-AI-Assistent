import { apiRequest } from "./queryClient";
import type { 
  ConsultationSession, 
  AIAnalysisResult, 
  ConversationEntry, 
  DiagnosisResult,
  MCQQuestion,
  TreatmentPathway,
  RiskAssessment,
  PatientEducation,
  ClinicalAlert
} from "../types/medical";

export const api = {
  // Session management
  createSession: async (sessionData: Partial<ConsultationSession>): Promise<ConsultationSession> => {
    const response = await apiRequest("POST", "/api/sessions", sessionData);
    return response.json();
  },

  getSession: async (sessionId: string): Promise<ConsultationSession> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}`);
    return response.json();
  },

  updateSession: async (sessionId: string, updates: Partial<ConsultationSession>): Promise<ConsultationSession> => {
    const response = await apiRequest("PATCH", `/api/sessions/${sessionId}`, updates);
    return response.json();
  },

  // AI Analysis
  generateFollowUpQuestions: async (data: {
    symptoms: string;
    mode: 'doctor' | 'patient';
    sessionId: string;
    patientInfo?: any;
  }): Promise<{ questions: string[] }> => {
    const response = await apiRequest("POST", "/api/generate-questions", data);
    return response.json();
  },

  analyzeSymptoms: async (data: {
    symptoms: string;
    mode: 'doctor' | 'patient';
    sessionId: string;
    patientInfo?: any;
    followUpAnswers?: Array<{ question: string; answer: string }>;
  }): Promise<AIAnalysisResult> => {
    const response = await apiRequest("POST", "/api/analyze", data);
    return response.json();
  },

  // Conversation
  getConversationHistory: async (sessionId: string): Promise<ConversationEntry[]> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/conversation`);
    return response.json();
  },

  // Diagnoses
  getDiagnoses: async (sessionId: string): Promise<DiagnosisResult[]> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/diagnoses`);
    return response.json();
  },

  // Export
  exportSession: async (sessionId: string): Promise<Blob> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/export`);
    return response.blob();
  },

  // Education
  getEducationContent: async (diagnosis: string): Promise<{ content: string }> => {
    const response = await apiRequest("POST", "/api/education", { diagnosis });
    return response.json();
  },

  // MCQ Questions
  generateMCQQuestions: async (data: {
    diagnosis: string;
    patientInfo?: any;
    mode: 'doctor' | 'patient';
  }): Promise<{ questions: MCQQuestion[] }> => {
    const response = await apiRequest("POST", "/api/generate-mcq", data);
    return response.json();
  },

  // Enhanced Analysis Features
  getTreatmentPathway: async (data: {
    diagnosis: string;
    patientInfo?: any;
  }): Promise<TreatmentPathway> => {
    const response = await apiRequest("POST", "/api/treatment-pathway", data);
    return response.json();
  },

  getRiskAssessment: async (data: {
    diagnosis: string;
    symptoms: string;
    patientInfo?: any;
  }): Promise<RiskAssessment> => {
    const response = await apiRequest("POST", "/api/risk-assessment", data);
    return response.json();
  },

  getPatientEducation: async (data: {
    diagnosis: string;
    educationLevel: string;
    language: string;
  }): Promise<PatientEducation> => {
    const response = await apiRequest("POST", "/api/patient-education", data);
    return response.json();
  },

  getClinicalAlerts: async (data: {
    diagnosis: string;
    symptoms: string;
    patientInfo?: any;
  }): Promise<ClinicalAlert[]> => {
    const response = await apiRequest("POST", "/api/clinical-alerts", data);
    return response.json();
  },

  // Enhanced Analysis (combines multiple features)
  getEnhancedAnalysis: async (data: {
    symptoms: string;
    mode: 'doctor' | 'patient';
    sessionId: string;
    patientInfo?: any;
    followUpAnswers?: Array<{ question: string; answer: string }>;
  }): Promise<{
    analysis: AIAnalysisResult;
    mcqQuestions?: MCQQuestion[];
    treatmentPathway?: TreatmentPathway;
    riskAssessment?: RiskAssessment;
    patientEducation?: PatientEducation;
    clinicalAlerts?: ClinicalAlert[];
  }> => {
    const response = await apiRequest("POST", "/api/enhanced-analysis", data);
    return response.json();
  },

  // Health check
  checkHealth: async (): Promise<{ status: string; models: any }> => {
    const response = await apiRequest("GET", "/api/health");
    return response.json();
  }
};
