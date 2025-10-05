import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stethoscope, Circle, Menu, X, FileText, Download, Printer, Heart, Brain, Shield, Settings, Activity, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "../components/theme-toggle";
import ConsultationPanel from "../components/consultation-panel";
import { SidebarPanel } from "../components/sidebar-panel";
import { LoadingOverlay } from "../components/loading-overlay";
import { MedicalDashboard } from "../components/medical-dashboard";
import { EnhancedFeaturesPanel } from "../components/enhanced-features-panel";
import AdvancedAIFeatures from "../components/advanced-ai-features";
import EnhancedNavigationSidebar from "../components/enhanced-navigation-sidebar";
import SidebarToggle from "../components/sidebar-toggle";
import { NotificationProvider, useMedicalNotifications } from "../components/notification-system";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { medicalAPI } from "../lib/advanced-api";
import { api } from "../lib/api";
import type { AppMode, PatientInfo, AIAnalysisResult, ConsultationSession, FlowState, FollowUpQA, FollowUpMCQ, ConsultationFlow } from "../types/medical";

// Type adapter functions
const flowStateToConsultationFlow = (flowState: FlowState): ConsultationFlow => ({
  step: flowState.step || 'user-type',
  userType: flowState.userType,
  symptoms: flowState.symptoms,
  questionType: flowState.questionType,
  followUpQuestions: flowState.followUpQuestions,
  followUpAnswers: flowState.followUpAnswers,
  followUpMCQs: flowState.followUpMCQs,
  specializedMCQs: flowState.specializedMCQs,
  specializedMCQAnswers: flowState.specializedMCQAnswers,
  analysis: flowState.analysis
});

const consultationFlowToFlowState = (flow: ConsultationFlow): FlowState => ({
  step: flow.step as any,
  userType: flow.userType,
  symptoms: flow.symptoms || '',
  questionType: flow.questionType,
  followUpQuestions: flow.followUpQuestions || [],
  followUpAnswers: flow.followUpAnswers || [],
  followUpMCQs: flow.followUpMCQs,
  specializedMCQs: flow.specializedMCQs,
  specializedMCQAnswers: flow.specializedMCQAnswers,
  analysis: flow.analysis
});

function HomeContent() {
  const { toast } = useToast();
  const notifications = useMedicalNotifications();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AppMode>('unified');
  const [activeTab, setActiveTab] = useState('consultation');
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: undefined,
    gender: undefined,
    medicalHistory: ""
  });
  const [flowState, setFlowState] = useState<FlowState>({
    step: 'user-type',
    symptoms: '',
    followUpQuestions: [],
    followUpAnswers: [],
    analysis: undefined
  });
  const [sessionStartTime] = useState(new Date());
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [sessionDuration, setSessionDuration] = useState("00:00");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Enhanced navigation sidebar state
  const [enhancedSidebarOpen, setEnhancedSidebarOpen] = useState(false);
  const [activeEnhancedFeature, setActiveEnhancedFeature] = useState<string | undefined>();
  const [consultationCount, setConsultationCount] = useState(0);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  // Mock data for dashboard
  const [dashboardData] = useState({
    stats: {
      totalConsultations: 1247,
      criticalCases: 3,
      avgResponseTime: 2.3,
      accuracyRate: 96,
      patientsToday: 47,
      urgentAlerts: 2
    },
    vitals: {
      heartRate: 72,
      bloodPressure: "120/80",
      temperature: 98.6,
      oxygenSaturation: 98,
      respiratoryRate: 16
    }
  });

  // Update session duration every second
  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setSessionDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const timer = setInterval(updateDuration, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Create session on mount
  useEffect(() => {
    createSessionMutation.mutate({
      sessionId,
      mode,
      patientInfo,
    });
  }, []);

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 30000,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: api.createSession,
    onError: (error) => {
      toast({
        title: "Session Error",
        description: "Failed to create consultation session.",
        variant: "destructive",
      });
    },
  });

  // Generate follow-up questions mutation with enhanced API
  const generateQuestionsMutation = useMutation({
    mutationFn: (data: { symptoms: string; mode: AppMode; sessionId: string; patientInfo?: PatientInfo; questionType?: string }) => {
      // Convert unified mode to patient mode for API compatibility
      const apiMode = data.mode === 'unified' ? 'patient' : data.mode;
      return medicalAPI.generateQuestions(data.symptoms, apiMode, data.sessionId, data.patientInfo, data.questionType || 'mcq');
    },
    onSuccess: (result: any) => {
      // Handle different API response structures based on question type
      let followUpQuestions = [];
      let followUpMCQs = [];
      let questionType = 'open_ended';
      
      if (result.followUpMCQs && result.followUpMCQs.length > 0) {
        // MCQ response - convert MCQ objects to questions for display
        followUpMCQs = result.followUpMCQs;
        followUpQuestions = result.followUpMCQs.map((mcq: any) => mcq.question);
        questionType = 'mcq';
      } else if (result.questions && result.questions.length > 0) {
        // Open-ended response
        followUpQuestions = result.questions;
        questionType = 'open_ended';
      }
      
      setFlowState(prev => ({
        ...prev,
        step: 'questions',
        followUpQuestions,
        followUpMCQs,
        questionType: questionType as any
      }));
      setQueriesUsed(prev => prev + 1);
      notifications.success("Follow-up Questions Ready", "Please answer the questions to get a comprehensive analysis.");
    },
    onError: (error) => {
      notifications.error("Question Generation Failed", "Failed to generate follow-up questions. Please check AI service connectivity.");
    },
  });

  // Enhanced analyze symptoms mutation
  const analyzeMutation = useMutation({
    mutationFn: (data: { 
      symptoms: string; 
      mode: AppMode; 
      sessionId: string; 
      patientInfo?: PatientInfo;
      followUpAnswers?: FollowUpQA[];
    }) => {
      // Convert unified mode to patient mode for API compatibility
      const apiMode = data.mode === 'unified' ? 'patient' : data.mode as 'patient' | 'doctor';
      return api.getEnhancedAnalysis({
        ...data,
        mode: apiMode
      });
    },
    onSuccess: (result: any) => {
      try {
        // Ensure analysis has required structure
        const analysis = result?.analysis || {};
        const safeAnalysis = {
          diagnoses: Array.isArray(analysis.diagnoses) ? analysis.diagnoses : [],
          recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
          followUpQuestions: Array.isArray(analysis.followUpQuestions) ? analysis.followUpQuestions : [],
          redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
          recommendedTests: Array.isArray(analysis.recommendedTests) ? analysis.recommendedTests : [],
          overallConfidence: typeof analysis.overallConfidence === 'number' ? analysis.overallConfidence : 0,
          additionalNotes: analysis.additionalNotes || '',
          ...analysis
        };

        setFlowState(prev => {
          const newState = {
            ...prev,
            step: 'complete' as const,
            analysis: safeAnalysis as AIAnalysisResult,
            followUpMCQs: Array.isArray(result.followUpMCQs) ? result.followUpMCQs : [],
            mcqQuestions: Array.isArray(result.mcqQuestions) ? result.mcqQuestions : [],
            treatmentPathway: result.treatmentPathway || undefined,
            riskAssessment: result.riskAssessment || undefined,
            patientEducation: result.patientEducation || undefined,
            clinicalAlerts: Array.isArray(result.clinicalAlerts) ? result.clinicalAlerts : []
          };
          return newState;
        });
        setQueriesUsed(prev => prev + 1);
        
        if (safeAnalysis.diagnoses && safeAnalysis.diagnoses.length > 0) {
          const primaryDiagnosis = safeAnalysis.diagnoses[0];
          if (primaryDiagnosis && typeof primaryDiagnosis.confidence === 'number') {
            notifications.diagnosisComplete(
              (patientInfo as any)?.name || "Patient",
              Math.round(primaryDiagnosis.confidence * 100)
            );
          }
        }
      } catch (stateError) {
        console.error('Error updating state after analysis:', stateError);
        // Set a minimal safe state to prevent white screen
        setFlowState(prev => ({
          ...prev,
          step: 'complete' as const,
          analysis: {
            diagnoses: [],
            recommendations: [],
            followUpQuestions: [],
            redFlags: [],
            recommendedTests: [],
            overallConfidence: 0,
            additionalNotes: 'Analysis completed but data structure was invalid'
          } as AIAnalysisResult
        }));
      }
    },
    onError: (error) => {
      console.error('Analysis mutation error:', error);
      notifications.error("Analysis Failed", "Failed to analyze symptoms. Please check AI service connectivity.");
    },
  });

  // Export session mutation with enhanced API
  const exportMutation = useMutation({
    mutationFn: () => medicalAPI.exportSession(sessionId),
    onSuccess: (result) => {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `consultation-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.success("Export Successful", "Clinical notes have been exported successfully.");
    },
    onError: () => {
      notifications.error("Export Failed", "Failed to export session data.");
    },
  });

  const handleStartFlow = (symptoms: string, questionType?: string) => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms",
        description: "Please enter symptoms before starting analysis.",
        variant: "destructive",
      });
      return;
    }

    setFlowState(prev => ({ ...prev, symptoms }));

    generateQuestionsMutation.mutate({
      symptoms,
      mode,
      sessionId,
      patientInfo,
      questionType: questionType || 'mcq', // Default to MCQ if not specified
    });
  };

  const handleAnswerQuestions = (answers: FollowUpQA[]) => {
    setFlowState(prev => ({ ...prev, followUpAnswers: answers }));

    analyzeMutation.mutate({
      symptoms: flowState.symptoms,
      mode,
      sessionId,
      patientInfo,
      followUpAnswers: answers,
    });
  };

  const handleSkipQuestions = () => {
    // Proceed directly to analysis without follow-up answers
    analyzeMutation.mutate({
      symptoms: flowState.symptoms,
      mode,
      sessionId,
      patientInfo,
    });
  };

  const handleClear = () => {
    // Generate a new session ID for the new consultation
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Reset flow state
    setFlowState({
      step: 'symptoms',
      symptoms: '',
      followUpQuestions: [],
      followUpAnswers: [],
      analysis: undefined
    });

    // Reset patient info for fresh start
    setPatientInfo({ name: "", age: undefined, gender: undefined, medicalHistory: "" });
    
    // Create new session
    createSessionMutation.mutate({
      sessionId: newSessionId,
      mode,
      patientInfo: { name: "", age: undefined, gender: undefined, medicalHistory: "" },
    });

    toast({
      title: "New Consultation Started",
      description: "Fresh consultation session created successfully.",
    });
  };

  const handleFollowUpQuestionClick = (question: string) => {
    setFlowState(prev => ({ 
      ...prev, 
      symptoms: question,
      step: 'symptoms'
    }));
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const isConnected = (healthData as any)?.models?.reasoner === 'connected' && (healthData as any)?.models?.chat === 'connected' || false;

  // Generate medical report function
  const generateMedicalReport = () => {
    if (!flowState.analysis) return null;

    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
MEDICAL CONSULTATION REPORT
=====================================

PATIENT INFORMATION:
-------------------
Patient ID: ${patientInfo.id || 'N/A'}
Age: ${patientInfo.age || 'N/A'}
Gender: ${patientInfo.gender ? patientInfo.gender.charAt(0).toUpperCase() + patientInfo.gender.slice(1) : 'N/A'}
Consultation Date: ${reportDate}
Consultation Time: ${reportTime}
Session Duration: ${sessionDuration}
Session ID: ${sessionId}

PRESENTING SYMPTOMS:
------------------
${flowState.symptoms || 'No symptoms recorded'}

FOLLOW-UP QUESTIONS & ANSWERS:
-----------------------------
${(flowState.followUpAnswers || []).map((qa, index) => `
Q${index + 1}: ${qa.question}
A${index + 1}: ${qa.answer || 'Not answered'}
`).join('')}

DIFFERENTIAL DIAGNOSES:
---------------------
${(flowState.analysis.diagnoses || []).map((diagnosis, index) => `
${index + 1}. ${diagnosis.name} (Confidence: ${diagnosis.confidence}%)
   Category: ${diagnosis.category}
   Description: ${diagnosis.description}
   
   Red Flags:
   ${(diagnosis.redFlags || []).map(flag => `   • ${flag}`).join('\n')}
   
   Recommended Tests:
   ${(diagnosis.recommendedTests || []).map(test => `   • ${test}`).join('\n')}
`).join('\n')}

OVERALL ASSESSMENT:
-----------------
Overall Confidence Level: ${flowState.analysis.overallConfidence || 'N/A'}%

CRITICAL RED FLAGS:
-----------------
${(flowState.analysis.redFlags || []).length > 0 ? 
  (flowState.analysis.redFlags || []).map(flag => `⚠️ ${flag}`).join('\n') : 
  'No critical red flags identified'}

RECOMMENDED INVESTIGATIONS:
-------------------------
${(flowState.analysis.recommendedTests || []).length > 0 ? 
  (flowState.analysis.recommendedTests || []).map(test => `• ${test}`).join('\n') : 
  'No specific tests recommended'}

CLINICAL NOTES:
--------------
This consultation was conducted using AI-assisted diagnostic support.
All findings should be correlated with clinical examination and physician judgment.
This report is for medical professional review and should not replace clinical assessment.

Report Generated: ${reportDate} at ${reportTime}
Generated by: AI Healthcare Assistant v1.0
-------------------------------------------
END OF REPORT
    `.trim();
  };

  // Download report function
  const downloadReport = () => {
    const report = generateMedicalReport();
    if (!report) {
      toast({
        title: "No Report Available",
        description: "Complete the consultation to generate a medical report.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-report-${sessionId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Medical report has been saved to your downloads.",
    });
  };

  // Print report function
  const printReport = () => {
    const report = generateMedicalReport();
    if (!report) {
      toast({
        title: "No Report Available",
        description: "Complete the consultation to generate a medical report.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Medical Report - ${sessionId}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                line-height: 1.6; 
                margin: 20px; 
                color: #333;
              }
              h1 { text-align: center; border-bottom: 2px solid #333; }
              .section { margin: 20px 0; }
              .warning { color: #d73502; font-weight: bold; }
            </style>
          </head>
          <body>
            <pre>${report}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // New consultation restart function
  const handleStartNewConsultation = () => {
    // Reset all state to initial values
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    setFlowState({
      step: 'user-type',
      symptoms: '',
      followUpQuestions: [],
      followUpAnswers: [],
      analysis: undefined,
      specializedMCQs: undefined,
      specializedMCQAnswers: undefined
    });

    setPatientInfo({ name: "", age: undefined, gender: undefined, medicalHistory: "" });
    setQueriesUsed(0);
    
    // Increment consultation count
    setConsultationCount(prev => prev + 1);
    
    // Exit standalone mode and close enhanced sidebar
    setIsStandaloneMode(false);
    setActiveEnhancedFeature(undefined);
    setEnhancedSidebarOpen(false);
    
    // Create new session
    createSessionMutation.mutate({
      sessionId: newSessionId,
      mode,
      patientInfo: { name: "", age: undefined, gender: undefined, medicalHistory: "" },
    });

    toast({
      title: "New Consultation Started",
      description: "Ready for your next consultation session.",
    });
  };

  // Generate specialized MCQs based on consultation results
  const handleGenerateSpecializedMCQs = async (analysis: AIAnalysisResult) => {
    if (!analysis || !analysis.diagnoses || analysis.diagnoses.length === 0) {
      toast({
        title: "No Analysis Available",
        description: "Complete a consultation first to generate specialized questions.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate context-aware MCQs based on the consultation
      const primaryDiagnosis = analysis.diagnoses[0];
      const symptoms = flowState.symptoms;
      const patientProfile = {
        age: patientInfo.age,
        gender: patientInfo.gender,
        medicalHistory: patientInfo.medicalHistory
      };

      // Create specialized MCQs with enhanced educational value
      const specializedQuestions = generateContextualMCQs(
        primaryDiagnosis.name,
        symptoms,
        patientProfile,
        analysis.diagnoses
      );

      setFlowState(prev => ({
        ...prev,
        step: 'specialized-mcq',
        specializedMCQs: specializedQuestions,
        specializedMCQAnswers: []
      }));

      setQueriesUsed(prev => prev + 1);

      toast({
        title: "Specialized Quiz Generated",
        description: `${specializedQuestions.length} advanced questions created based on your consultation.`,
      });
    } catch (error) {
      console.error('Error generating specialized MCQs:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate specialized questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to generate contextual MCQs
  const generateContextualMCQs = (primaryDiagnosis: string, symptoms: string, patientProfile: any, allDiagnoses: any[]) => {
    const questions = [];
    
    // Analyze the diagnosis to generate specialized questions
    const diagnosisLower = primaryDiagnosis.toLowerCase();
    const symptomsLower = symptoms.toLowerCase();
    const confidence = allDiagnoses[0]?.confidence || 75;
    const age = patientProfile.age || 35;
    const gender = patientProfile.gender || 'patient';
    
    // Get specialized question generators based on diagnosis type
    const questionGenerators = getSpecializedQuestionGenerators(diagnosisLower, symptomsLower, confidence, age, gender, allDiagnoses);
    
    // Generate 6-8 highly specific questions
    questions.push(...questionGenerators.slice(0, Math.min(8, questionGenerators.length)));
    
    return questions;
  };

  // Specialized question generators based on diagnosis patterns
  const getSpecializedQuestionGenerators = (diagnosis: string, symptoms: string, confidence: number, age: number, gender: string, allDiagnoses: any[]) => {
    const generators = [];
    
    // Infectious Disease Questions
    if (diagnosis.includes('fever') || diagnosis.includes('viral') || diagnosis.includes('infection') || diagnosis.includes('flu') || diagnosis.includes('dengue')) {
      generators.push(
        {
          id: `infectious-dx-${Date.now()}`,
          question: `A ${age}-year-old ${gender} presents with ${symptoms}. Based on the clinical presentation and epidemiological factors, what is the most likely infectious etiology?`,
          options: [
            {
              text: `${allDiagnoses[0]?.name} (confidence: ${confidence}%)`,
              isCorrect: true,
              explanation: `Given the symptom constellation of ${symptoms} in this demographic, ${allDiagnoses[0]?.name} shows the highest clinical correlation with typical presentation patterns and local epidemiology.`
            },
            {
              text: `${allDiagnoses[1]?.name || 'Bacterial pneumonia'}`,
              isCorrect: false,
              explanation: `While possible, the clinical pattern and analysis suggest ${allDiagnoses[0]?.name} is more likely based on symptom timeline and presentation.`
            },
            {
              text: `Autoimmune inflammatory condition`,
              isCorrect: false,
              explanation: `The acute onset and symptom pattern are more consistent with infectious rather than autoimmune etiology.`
            },
            {
              text: `Drug-induced reaction`,
              isCorrect: false,
              explanation: `No medication history or timeline suggests drug-induced symptoms in this case.`
            }
          ],
          category: "differential-diagnosis",
          difficultyLevel: "hard" as const,
          educationalValue: 10,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Infectious disease diagnosis requires correlation of clinical presentation, epidemiological factors, and laboratory findings.`
        },
        {
          id: `prognosis-infectious-${Date.now()}`,
          question: `What is the expected prognosis and timeline for recovery in this case of ${allDiagnoses[0]?.name}?`,
          options: [
            {
              text: `Good prognosis with complete recovery expected in 7-14 days with supportive care`,
              isCorrect: confidence > 70,
              explanation: `With high diagnostic confidence (${confidence}%) and typical presentation, most patients recover completely within 2 weeks with appropriate supportive care.`
            },
            {
              text: `Uncertain prognosis requiring immediate aggressive intervention`,
              isCorrect: confidence < 50,
              explanation: `Lower diagnostic confidence may warrant more aggressive monitoring and intervention until diagnosis is clarified.`
            },
            {
              text: `Chronic condition requiring long-term management`,
              isCorrect: false,
              explanation: `${allDiagnoses[0]?.name} typically has an acute course with full recovery expected.`
            },
            {
              text: `Requires immediate surgical intervention`,
              isCorrect: false,
              explanation: `This condition is managed medically, not surgically.`
            }
          ],
          category: "prognosis",
          difficultyLevel: "medium" as const,
          educationalValue: 9,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Prognostic assessment considers diagnostic confidence, patient factors, and natural disease history.`
        },
        {
          id: `treatment-infectious-${Date.now()}`,
          question: `What is the most appropriate initial treatment approach for this ${age}-year-old ${gender} with ${allDiagnoses[0]?.name}?`,
          options: [
            {
              text: `Supportive care with rest, hydration, antipyretics, and symptom monitoring`,
              isCorrect: diagnosis.includes('viral') || diagnosis.includes('dengue'),
              explanation: `Viral infections are best managed with supportive care. Antibiotics are not effective and may cause harm.`
            },
            {
              text: `Immediate broad-spectrum antibiotics`,
              isCorrect: diagnosis.includes('bacterial') && !diagnosis.includes('viral'),
              explanation: `Bacterial infections may require antibiotic therapy, but culture-guided therapy is preferred when possible.`
            },
            {
              text: `Antiviral medication and isolation precautions`,
              isCorrect: diagnosis.includes('influenza') || diagnosis.includes('covid'),
              explanation: `Specific viral infections may benefit from antiviral therapy when started early in the course.`
            },
            {
              text: `Immediate hospitalization and IV therapy`,
              isCorrect: false,
              explanation: `Most cases can be managed as outpatients unless complications develop.`
            }
          ],
          category: "treatment",
          difficultyLevel: "medium" as const,
          educationalValue: 10,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Treatment selection depends on pathogen type, severity, and patient risk factors.`
        }
      );
    }
    
    // Cardiac Questions
    if (diagnosis.includes('chest') || diagnosis.includes('heart') || diagnosis.includes('cardiac') || symptoms.includes('chest pain')) {
      generators.push(
        {
          id: `cardiac-assessment-${Date.now()}`,
          question: `For a ${age}-year-old ${gender} presenting with chest pain, which diagnostic approach provides the highest yield for ruling out acute coronary syndrome?`,
          options: [
            {
              text: `Serial ECGs, cardiac troponins, and clinical risk stratification`,
              isCorrect: true,
              explanation: `This combination provides the most sensitive and specific approach for ACS diagnosis while being cost-effective.`
            },
            {
              text: `Immediate cardiac catheterization for all patients`,
              isCorrect: false,
              explanation: `Invasive procedures should be reserved for high-risk patients or those with positive screening tests.`
            },
            {
              text: `CT angiography as first-line imaging`,
              isCorrect: age < 40 && !symptoms.includes('severe'),
              explanation: `CT angiography may be appropriate for low-risk younger patients with atypical presentations.`
            },
            {
              text: `Clinical assessment alone without testing`,
              isCorrect: false,
              explanation: `Chest pain requires objective testing to safely rule out life-threatening conditions.`
            }
          ],
          category: "diagnostic-approach",
          difficultyLevel: "hard" as const,
          educationalValue: 10,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Chest pain evaluation requires systematic approach to exclude life-threatening conditions.`
        },
        {
          id: `cardiac-prognosis-${Date.now()}`,
          question: `What factors most significantly influence the prognosis in this case of ${allDiagnoses[0]?.name}?`,
          options: [
            {
              text: `Patient age, symptom severity, and underlying cardiovascular risk factors`,
              isCorrect: true,
              explanation: `These factors are the strongest predictors of outcomes in chest pain syndromes.`
            },
            {
              text: `Time of symptom onset only`,
              isCorrect: false,
              explanation: `While timing is important, multiple factors influence prognosis.`
            },
            {
              text: `Patient's exercise tolerance alone`,
              isCorrect: false,
              explanation: `Exercise tolerance is one factor but not the sole prognostic indicator.`
            },
            {
              text: `Family history exclusively`,
              isCorrect: false,
              explanation: `Family history contributes to risk but current clinical factors are more predictive.`
            }
          ],
          category: "prognosis",
          difficultyLevel: "medium" as const,
          educationalValue: 8,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Prognostic assessment in chest pain requires multifactorial risk evaluation.`
        }
      );
    }
    
    // Neurological Questions
    if (diagnosis.includes('headache') || diagnosis.includes('migraine') || diagnosis.includes('neuro') || symptoms.includes('headache')) {
      generators.push(
        {
          id: `neuro-diagnosis-${Date.now()}`,
          question: `In this ${age}-year-old ${gender} with ${symptoms}, which red flag symptoms would most urgently require neuroimaging?`,
          options: [
            {
              text: `Sudden onset severe headache with neck stiffness`,
              isCorrect: true,
              explanation: `These symptoms suggest possible subarachnoid hemorrhage or meningitis, requiring immediate evaluation.`
            },
            {
              text: `Mild headache with normal neurological exam`,
              isCorrect: false,
              explanation: `Routine headaches with normal exams typically don't require emergent imaging.`
            },
            {
              text: `Chronic stable headache pattern`,
              isCorrect: false,
              explanation: `Stable chronic patterns are less concerning for acute pathology.`
            },
            {
              text: `Headache only during stress`,
              isCorrect: false,
              explanation: `Stress-related headaches are typically benign and don't require imaging.`
            }
          ],
          category: "red-flags",
          difficultyLevel: "hard" as const,
          educationalValue: 10,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Headache evaluation requires careful assessment for secondary causes requiring urgent intervention.`
        },
        {
          id: `neuro-treatment-${Date.now()}`,
          question: `What is the most appropriate treatment strategy for ${allDiagnoses[0]?.name} in this patient?`,
          options: [
            {
              text: `Combination of lifestyle modifications, trigger avoidance, and targeted medication`,
              isCorrect: diagnosis.includes('migraine') || diagnosis.includes('tension'),
              explanation: `Comprehensive headache management combines non-pharmacological and pharmacological approaches.`
            },
            {
              text: `High-dose opioids for pain control`,
              isCorrect: false,
              explanation: `Opioids are generally avoided in headache management due to rebound and dependency risks.`
            },
            {
              text: `Immediate neurosurgical consultation`,
              isCorrect: false,
              explanation: `Most headaches are managed medically; surgery is reserved for specific structural causes.`
            },
            {
              text: `No treatment needed, observation only`,
              isCorrect: false,
              explanation: `Appropriate treatment improves quality of life and prevents progression.`
            }
          ],
          category: "treatment",
          difficultyLevel: "medium" as const,
          educationalValue: 9,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Headache treatment should be individualized based on headache type, frequency, and patient factors.`
        }
      );
    }
    
    // Respiratory Questions
    if (diagnosis.includes('cough') || diagnosis.includes('respiratory') || diagnosis.includes('pneumonia') || symptoms.includes('cough') || symptoms.includes('breathing')) {
      generators.push(
        {
          id: `respiratory-diagnosis-${Date.now()}`,
          question: `In this case of ${allDiagnoses[0]?.name} with ${symptoms}, which investigation would provide the most diagnostic value?`,
          options: [
            {
              text: `Chest X-ray with clinical correlation`,
              isCorrect: true,
              explanation: `Chest X-ray is the initial imaging of choice for respiratory symptoms, providing good diagnostic yield.`
            },
            {
              text: `High-resolution CT scan immediately`,
              isCorrect: false,
              explanation: `CT is reserved for cases where chest X-ray is non-diagnostic or complications are suspected.`
            },
            {
              text: `Bronchoscopy as first-line investigation`,
              isCorrect: false,
              explanation: `Bronchoscopy is invasive and reserved for specific indications after initial workup.`
            },
            {
              text: `No imaging required`,
              isCorrect: false,
              explanation: `Respiratory symptoms typically warrant objective assessment with imaging.`
            }
          ],
          category: "diagnostic-approach",
          difficultyLevel: "medium" as const,
          educationalValue: 8,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Respiratory evaluation follows systematic approach from basic to advanced investigations.`
        },
        {
          id: `respiratory-complications-${Date.now()}`,
          question: `What complication should be most closely monitored for in this case of ${allDiagnoses[0]?.name}?`,
          options: [
            {
              text: `Development of respiratory distress or hypoxemia`,
              isCorrect: true,
              explanation: `Respiratory compromise is the most serious potential complication requiring immediate intervention.`
            },
            {
              text: `Mild fatigue and decreased appetite`,
              isCorrect: false,
              explanation: `These are common symptoms but not dangerous complications requiring monitoring.`
            },
            {
              text: `Temporary voice changes`,
              isCorrect: false,
              explanation: `Voice changes are typically benign and self-limiting.`
            },
            {
              text: `Skin rash development`,
              isCorrect: false,
              explanation: `Skin manifestations are less critical than respiratory complications.`
            }
          ],
          category: "complications",
          difficultyLevel: "medium" as const,
          educationalValue: 9,
          relatedDiagnosis: allDiagnoses[0]?.name,
          clinicalContext: `Monitoring focuses on detecting serious complications that require immediate intervention.`
        }
      );
    }
    
    // General Medicine Questions (always included)
    generators.push(
      {
        id: `clinical-reasoning-${Date.now()}`,
        question: `Based on the diagnostic confidence of ${confidence}% for ${allDiagnoses[0]?.name}, what is the most appropriate next step?`,
        options: [
          {
            text: confidence >= 80 ? `Proceed with treatment based on clinical diagnosis` : `Gather additional diagnostic information before treatment`,
            isCorrect: true,
            explanation: confidence >= 80 ? 
              `High confidence (${confidence}%) supports proceeding with evidence-based treatment.` : 
              `Lower confidence (${confidence}%) warrants additional evaluation to improve diagnostic certainty.`
          },
          {
            text: `Treat empirically regardless of confidence level`,
            isCorrect: false,
            explanation: `Treatment decisions should consider diagnostic confidence and potential risks of therapy.`
          },
          {
            text: `Wait for symptoms to resolve without intervention`,
            isCorrect: false,
            explanation: `Active management is typically appropriate when a diagnosis is established.`
          },
          {
            text: `Immediately escalate to specialist care`,
            isCorrect: false,
            explanation: `Most conditions can be initially managed in primary care with specialist referral when indicated.`
          }
        ],
        category: "clinical-reasoning",
        difficultyLevel: "hard" as const,
        educationalValue: 10,
        relatedDiagnosis: allDiagnoses[0]?.name,
        clinicalContext: `Clinical decision-making integrates diagnostic confidence with treatment risks and benefits.`
      },
      {
        id: `patient-counseling-${Date.now()}`,
        question: `When counseling this ${age}-year-old ${gender} about ${allDiagnoses[0]?.name}, which information is most crucial for patient safety?`,
        options: [
          {
            text: `Warning signs that require immediate medical attention`,
            isCorrect: true,
            explanation: `Patient safety education about when to seek emergency care is the highest priority in all consultations.`
          },
          {
            text: `Detailed pathophysiology of the condition`,
            isCorrect: false,
            explanation: `While educational, detailed mechanisms are less critical than safety information.`
          },
          {
            text: `Complete list of all possible rare complications`,
            isCorrect: false,
            explanation: `Extensive complication lists may cause unnecessary anxiety without improving outcomes.`
          },
          {
            text: `Insurance and billing information`,
            isCorrect: false,
            explanation: `Administrative details are important but secondary to medical safety information.`
          }
        ],
        category: "patient-education",
        difficultyLevel: "easy" as const,
        educationalValue: 10,
        relatedDiagnosis: allDiagnoses[0]?.name,
        clinicalContext: `Patient education prioritizes safety while providing appropriate level of detail for informed decision-making.`
      }
    );
    
    return generators;
  };

  // Enhanced Feature Selection Handler
  const handleEnhancedFeatureSelect = (featureId: string) => {
    setActiveEnhancedFeature(featureId);
    setIsStandaloneMode(true);
    
    // Switch to the appropriate tab based on feature
    if (featureId === 'consultation-mode') {
      setActiveTab('consultation');
      setIsStandaloneMode(false);
      setEnhancedSidebarOpen(false);
    } else if (featureId === 'api-testing') {
      // Switch to dashboard tab for API testing
      setActiveTab('dashboard');
      setEnhancedSidebarOpen(false);
      toast({
        title: "API Testing Dashboard",
        description: "Access comprehensive API testing tools in the dashboard.",
      });
    } else if (featureId === 'help') {
      // Show help modal or navigate to help section
      toast({
        title: "Feature Guide",
        description: "Interactive help system coming soon! For now, hover over features for tooltips.",
      });
    } else {
      // For other features, switch to advanced-ai tab and set active feature
      setActiveTab('advanced-ai');
      
      // Optional: Close sidebar on mobile after selection
      if (isMobile) {
        setEnhancedSidebarOpen(false);
      }
      
      toast({
        title: "Enhanced Feature Activated",
        description: `${featureId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is now active.`,
      });
    }
  };

  // Enhanced Sidebar Toggle Handler
  const handleEnhancedSidebarToggle = () => {
    setEnhancedSidebarOpen(!enhancedSidebarOpen);
  };

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <div className="h-full">
          <SidebarPanel
            sessionId={sessionId}
            sessionDuration={sessionDuration}
            queriesUsed={queriesUsed}
            overallConfidence={flowState.analysis?.overallConfidence || 0}
            onExport={() => {
              handleExport();
              setSidebarOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation Sidebar */}
      <EnhancedNavigationSidebar
        isOpen={enhancedSidebarOpen}
        onToggle={handleEnhancedSidebarToggle}
        onFeatureSelect={handleEnhancedFeatureSelect}
        activeFeature={activeEnhancedFeature}
        consultationCount={consultationCount}
        isConsultationMode={!isStandaloneMode}
        userType={flowState.userType === 'not_specified' ? 'patient' : flowState.userType || 'patient'}
        accessibilityLevel="enhanced"
      />
      
      {/* Sidebar Toggle Button */}
      <SidebarToggle
        isOpen={enhancedSidebarOpen}
        onToggle={handleEnhancedSidebarToggle}
      />

      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2 gradient-primary rounded-xl shadow-lg flex-shrink-0">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap">
                  AI Diagnostic Copilot
                </h1>
                <p className="text-sm text-muted-foreground whitespace-nowrap">Intelligent Medical Analysis Assistant</p>
              </div>
              <div className="block sm:hidden min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AI Diagnostic
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'AI Connected' : 'AI Disconnected'}
                </span>
              </div>
              <ThemeToggle />
              {isMobile && <MobileSidebar />}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content with Tabs */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-gradient-hero h-12">
              <TabsTrigger value="consultation" className="text-white data-[state=active]:bg-white/20">
                <Stethoscope className="h-4 w-4 mr-2" />
                Consultation
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-white/20">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="features" className="text-white data-[state=active]:bg-white/20">
                <Settings className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger value="advanced-ai" className="text-white data-[state=active]:bg-white/20">
                <Brain className="h-4 w-4 mr-2" />
                Advanced AI
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="text-white data-[state=active]:bg-white/20">
                <Activity className="h-4 w-4 mr-2" />
                Monitoring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consultation">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Consultation Panel - Takes more space */}
                <div className="xl:col-span-3">
                  <ConsultationPanel
                    patientInfo={patientInfo}
                    flowState={flowStateToConsultationFlow(flowState)}
                    isLoading={analyzeMutation.isPending || generateQuestionsMutation.isPending}
                    onPatientInfoChange={setPatientInfo}
                    onSymptomSubmit={handleStartFlow}
                    onFlowChange={(flow: ConsultationFlow) => setFlowState(consultationFlowToFlowState(flow))}
                    onFollowUpSubmit={handleAnswerQuestions}
                    onSkipQuestions={handleSkipQuestions}
                  />
                </div>

                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden xl:block xl:col-span-1">
                  <SidebarPanel
                    sessionId={sessionId}
                    sessionDuration={sessionDuration}
                    queriesUsed={queriesUsed}
                    overallConfidence={flowState.analysis?.overallConfidence || 0}
                    onExport={handleExport}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard">
              <MedicalDashboard
                stats={dashboardData.stats}
                vitals={dashboardData.vitals}
                onEmergencyAlert={() => {
                  notifications.emergencyAlert(
                    "Emergency Response Activated",
                    "Medical team has been notified and is responding",
                    [
                      {
                        label: "View Details",
                        action: () => setActiveTab("monitoring")
                      }
                    ]
                  );
                }}
              />
            </TabsContent>

            <TabsContent value="features">
              <EnhancedFeaturesPanel />
            </TabsContent>

            <TabsContent value="advanced-ai">
              <AdvancedAIFeatures 
                patientInfo={patientInfo}
                analysis={flowState.analysis}
                activeFeature={activeEnhancedFeature}
                onFeatureResult={(feature, result) => {
                  toast({
                    title: "AI Feature Complete",
                    description: `${feature.replace('-', ' ')} analysis has been completed.`,
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="monitoring">
              <div className="space-y-6">
                <Card className="medical-card-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 medical-heading-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Real-time Patient Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="medical-card-success">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Heart className="h-5 w-5 text-red-500 pulse-medical" />
                              <span className="font-medium">Heart Rate</span>
                            </div>
                            <span className="text-xl font-bold text-red-500">
                              {dashboardData.vitals.heartRate} BPM
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="medical-card-warning">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-blue-500" />
                              <span className="font-medium">Blood Pressure</span>
                            </div>
                            <span className="text-xl font-bold text-blue-500">
                              {dashboardData.vitals.bloodPressure}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="consultation-card">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-green-500" />
                              <span className="font-medium">O2 Saturation</span>
                            </div>
                            <span className="text-xl font-bold text-green-500">
                              {dashboardData.vitals.oxygenSaturation}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="medical-card-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Analysis Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Model Accuracy</span>
                        <Badge className="severity-low">96.2%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Processing Speed</span>
                        <Badge className="severity-low">Fast</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>System Load</span>
                        <Badge className="severity-medium">Medium</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card-success">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Data Encryption</span>
                        <Badge className="severity-low">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Access Control</span>
                        <Badge className="severity-low">Secure</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Audit Logging</span>
                        <Badge className="severity-low">Enabled</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Button for Report Export */}
      {flowState.analysis && (
        <div className="medical-fab gradient-primary">
          <Button
            size="lg"
            className="w-full h-full rounded-full bg-transparent hover:bg-transparent text-white shadow-none hover:shadow-xl transition-all duration-300"
            onClick={downloadReport}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={analyzeMutation.isPending || generateQuestionsMutation.isPending}
        message={generateQuestionsMutation.isPending ? "Generating Follow-up Questions" : "AI Analysis in Progress"}
      />
    </div>
  );
}

export default function Home() {
  return (
    <NotificationProvider position="top-right" maxNotifications={3}>
      <HomeContent />
    </NotificationProvider>
  );
}
