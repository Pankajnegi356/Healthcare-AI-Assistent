export interface PatientInfo {
  id?: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  medicalHistory: string;
}

export interface ConsultationFlow {
  step: string;
  userType?: UserType;
  symptoms?: string;
  questionType?: QuestionType;
  followUpQuestions?: string[];
  followUpAnswers?: FollowUpQA[];
  followUpMCQs?: FollowUpMCQ[];
  specializedMCQs?: any[];
  specializedMCQAnswers?: any[];
  analysis?: AIAnalysisResult;
}

export interface DiagnosisResult {
  id?: number;
  name: string;
  description: string;
  confidence: number;
  severity?: string;
  probability?: number;
  category: string;
  redFlags: string[];
  recommendedTests: string[];
}

export interface FollowUpMCQ {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    value: string;
  }[];
  category: string;
}

export interface AIAnalysisResult {
  diagnoses: DiagnosisResult[];
  recommendations?: {
    action: string;
    priority?: string;
    urgency?: string;
  }[];
  followUpQuestions: string[];
  followUpMCQs?: FollowUpMCQ[];
  redFlags: string[];
  recommendedTests: string[];
  overallConfidence: number;
  additionalNotes?: string;
}

export interface ConversationEntry {
  id?: number;
  type: 'user' | 'ai';
  message: string;
  timestamp?: Date;
}

export interface ConsultationSession {
  id?: number;
  sessionId: string;
  mode: AppMode;
  userType?: UserType;
  patientInfo?: PatientInfo;
  symptoms?: string;
  aiAnalysis?: AIAnalysisResult;
  conversationHistory?: ConversationEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppMode = 'unified' | 'doctor' | 'patient';
export type QuestionType = 'mcq' | 'open_ended';
export type UserType = 'healthcare_professional' | 'patient' | 'parent' | 'caregiver' | 'not_specified';

export interface FollowUpQA {
  questionId: string;
  question: string;
  answer: string;
}

export interface FlowState {
  step?: 'user-type' | 'patient-info' | 'symptoms' | 'question-type' | 'questions' | 'analysis' | 'mcq' | 'specialized-mcq' | 'complete';
  userType?: UserType;
  questionType?: QuestionType;
  symptoms: string;
  followUpQuestions: string[];
  followUpMCQs?: FollowUpMCQ[];
  followUpAnswers: FollowUpQA[];
  analysis?: AIAnalysisResult;
  mcqQuestions?: MCQQuestion[];
  mcqAnswers?: { questionIndex: number; selectedOption: number; isCorrect: boolean }[];
  specializedMCQs?: SpecializedMCQ[];
  specializedMCQAnswers?: { questionIndex: number; selectedOption: number; isCorrect: boolean }[];
  treatmentPathway?: TreatmentPathway;
  riskAssessment?: RiskAssessment;
  patientEducation?: PatientEducation;
  clinicalAlerts?: ClinicalAlert[];
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
  followUp?: string;
  explanation?: string;
}

export interface SpecializedMCQ {
  id: string;
  question: string;
  options: MCQOption[];
  category: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  educationalValue: number;
  relatedDiagnosis: string;
  clinicalContext: string;
  explanation?: string;
}

export interface TreatmentPathway {
  primaryTreatment: string;
  alternativeOptions: string[];
  contraindications: string[];
  expectedDuration: string;
  monitoringParameters: string[];
  followUpSchedule: string;
}

export interface RiskAssessment {
  immediateRisk: 'low' | 'medium' | 'high' | 'critical';
  shortTermRisk: 'low' | 'medium' | 'high';
  longTermRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
}

export interface PatientEducation {
  simpleExplanation: string;
  lifestyleModifications: string[];
  warningSignsToWatch: string[];
  whenToSeekHelp: string[];
  customizedContent: string;
}

export interface ClinicalAlert {
  type: 'critical' | 'warning' | 'info';
  priority: number;
  message: string;
  actionRequired: string;
  timeframe: string;
}
