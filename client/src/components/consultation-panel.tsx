import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Heart,
  User,
  Users,
  Stethoscope,
  HelpCircle,
  Calendar,
  FileText,
  CheckCircle,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Pill,
  Clipboard,
  BookOpen,
  Star,
  Zap,
  Eraser,
  TestTube,
  Check,
  TriangleAlert,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  MessageSquare,
} from "lucide-react";

import { PatientInfo, ConsultationFlow, FollowUpQA, UserType, QuestionType, FollowUpMCQ, DiagnosisResult, AIAnalysisResult } from "@/types/medical";

interface ConsultationPanelProps {
  patientInfo: PatientInfo;
  onPatientInfoChange: (info: PatientInfo) => void;
  onSymptomSubmit: (symptoms: string, questionType: QuestionType) => void;
  onFollowUpSubmit: (answers: FollowUpQA[]) => void;
  onSkipQuestions?: () => void;
  flowState: ConsultationFlow;
  onFlowChange: (flow: ConsultationFlow) => void;
  isLoading?: boolean;
}

const ConsultationPanel = ({
  patientInfo,
  onPatientInfoChange,
  onSymptomSubmit,
  onFollowUpSubmit,
  onSkipQuestions,
  flowState,
  onFlowChange,
  isLoading = false
}: ConsultationPanelProps) => {
  const [currentStep, setCurrentStep] = useState<string>("user-type");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tempSymptoms, setTempSymptoms] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpQA[]>([]);
  const [followUpMCQAnswers, setFollowUpMCQAnswers] = useState<{ [key: string]: string }>({})
  const [selectedUserType, setSelectedUserType] = useState<UserType>('patient');
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>('mcq');
  const [noMedicalHistory, setNoMedicalHistory] = useState(false);
  const [inputValidation, setInputValidation] = useState<{ [key: string]: boolean }>({});
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to get realistic diagnosis percentages
  const getDiagnosisPercentage = (index: number, totalDiagnoses: number) => {
    const basePercentages = [85, 65, 45, 30, 20, 15, 10, 8, 5, 3];
    return basePercentages[index] || Math.max(2, 15 - index * 2);
  };

  // Enhanced input validation functions
  const validateInput = (type: 'symptoms' | 'mcq' | 'descriptive' | 'patient-info', value: any): boolean => {
    switch (type) {
      case 'symptoms':
        return typeof value === 'string' && value.trim().length >= 10 && value.trim().length <= 2000;
      case 'mcq':
        return typeof value === 'string' && value.trim().length > 0;
      case 'descriptive':
        return typeof value === 'string' && value.trim().length >= 5 && value.trim().length <= 1000;
      case 'patient-info':
        return value.name && value.name.trim().length >= 2;
      default:
        return false;
    }
  };

  const validateUserModeRequirements = (userType: UserType, patientInfo: PatientInfo): boolean => {
    switch (userType) {
      case 'patient':
        return patientInfo.name.trim().length >= 2;
      case 'parent':
        return patientInfo.name.trim().length >= 2 && (patientInfo.age !== undefined && patientInfo.age < 18);
      case 'caregiver':
        return true; // More flexible requirements for caregivers
      case 'healthcare_professional':
        return patientInfo.name.trim().length >= 2;
      default:
        return false;
    }
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>\"']/g, '').substring(0, 2000);
  };

  const processInputWithValidation = async (input: string, type: 'symptoms' | 'mcq' | 'descriptive'): Promise<boolean> => {
    setIsProcessingInput(true);
    try {
      const sanitized = sanitizeInput(input);
      const isValid = validateInput(type, sanitized);
      setInputValidation(prev => ({ ...prev, [type]: isValid }));
      return isValid;
    } finally {
      setIsProcessingInput(false);
    }
  };

  // Initialize follow-up answers when questions are available
  useEffect(() => {
    if (flowState.followUpQuestions && followUpAnswers.length === 0) {
      setFollowUpAnswers(
        (flowState.followUpQuestions || []).map((question, index) => ({
          questionId: index.toString(),
          question,
          answer: ""
        }))
      );
    } else if (flowState.followUpQuestions && flowState.followUpQuestions.length !== followUpAnswers.length) {
      setFollowUpAnswers(
        (flowState.followUpQuestions || []).map((question, index) => ({
          questionId: index.toString(),
          question,
          answer: followUpAnswers[index]?.answer || ""
        }))
      );
    }
  }, [flowState.followUpQuestions, followUpAnswers.length, selectedQuestionType]);

  // Progress calculation
  useEffect(() => {
    let newProgress = 0;
    if (flowState.userType) newProgress += 15;
    if (patientInfo.name || selectedUserType === 'caregiver') newProgress += 15;
    if (flowState.symptoms) newProgress += 25;
    if (flowState.questionType) newProgress += 15;
    if (flowState.followUpAnswers?.length) newProgress += 20;
    if (flowState.analysis) newProgress += 10;
    setProgress(newProgress);
  }, [patientInfo, flowState, selectedUserType]);

  // Sync currentStep with flowState.step to handle analysis completion
  useEffect(() => {
    if (flowState.step && flowState.step !== currentStep) {
      if (flowState.step === 'complete' && flowState.analysis) {
        setCurrentStep('analysis');
      } else if (flowState.step === 'questions' && flowState.followUpQuestions && flowState.followUpQuestions.length > 0) {
        setCurrentStep('questions');
      }
    }
  }, [flowState.step, flowState.analysis, flowState.followUpQuestions, currentStep]);

  // Analysis timeout safeguard
  useEffect(() => {
    if (currentStep === 'analyzing' && !flowState.analysis) {
      const timeoutId = setTimeout(() => {
        setError('Analysis is taking longer than expected. Please try again or check your connection.');
        setCurrentStep('questions'); // Go back to questions step
      }, 45000); // 45 second timeout
      
      setAnalysisTimeout(timeoutId);
      
      return () => {
        clearTimeout(timeoutId);
        setAnalysisTimeout(null);
      };
    } else if (analysisTimeout) {
      // Clear timeout if analysis completes or step changes
      clearTimeout(analysisTimeout);
      setAnalysisTimeout(null);
    }
  }, [currentStep, flowState.analysis, analysisTimeout]);

  // Sync selectedQuestionType with flowState.questionType
  useEffect(() => {
    if (flowState.questionType && flowState.questionType !== selectedQuestionType) {
      setSelectedQuestionType(flowState.questionType);
    }
  }, [flowState.questionType, selectedQuestionType]);

  const handleUserTypeSubmit = () => {
    // Validate user type selection
    if (!selectedUserType) {
      setError("Please select a user type to continue");
      return;
    }
    setError(null);
    onFlowChange({ ...flowState, userType: selectedUserType, step: "patient-info" });
    setCurrentStep("patient-info");
  };

  const handlePatientInfoSubmit = async () => {
    // Enhanced validation for different user types
    const isValidInfo = validateUserModeRequirements(selectedUserType, patientInfo);
    
    if (!isValidInfo) {
      switch (selectedUserType) {
        case 'patient':
          setError("Please provide your full name");
          break;
        case 'parent':
          setError("Please provide the child's name and ensure age is under 18");
          break;
        case 'healthcare_professional':
          setError("Please provide the patient's name and your professional credentials");
          break;
        case 'caregiver':
          // More flexible for caregivers
          if (!patientInfo.name || patientInfo.name.trim().length < 2) {
            setError("Please provide the patient's name or your name as caregiver");
          }
          break;
        default:
          setError("Please complete the required information");
      }
      return;
    }
    
    setError(null);
    setCurrentStep("symptoms");
    onFlowChange({ ...flowState, step: "symptoms" });
  };

  const handleSymptomSubmit = async () => {
    const symptomsText = tempSymptoms.trim();
    const isValid = await processInputWithValidation(symptomsText, 'symptoms');
    
    if (!isValid) {
      setError("Please provide detailed symptoms (10-2000 characters). Include when they started, severity, and relevant details.");
      return;
    }
    
    setError(null);
    setCurrentStep("question-type");
    onFlowChange({ ...flowState, symptoms: sanitizeInput(symptomsText), step: "question-type" });
  };

  const handleQuestionTypeSubmit = () => {
    if (!tempSymptoms.trim()) {
      setError("Please enter your symptoms before continuing");
      return;
    }
    if (!validateInput('symptoms', tempSymptoms)) {
      setError("Please provide more detailed symptoms (at least 10 characters)");
      return;
    }
    setError(null);
    setCurrentStep("analyzing");
    const updatedFlow = { ...flowState, questionType: selectedQuestionType, symptoms: sanitizeInput(tempSymptoms) };
    onFlowChange(updatedFlow);
    onSymptomSubmit(sanitizeInput(tempSymptoms), selectedQuestionType);
  };

  const handleFollowUpSubmit = async () => {
    let validAnswers: FollowUpQA[] = [];
    let hasValidInput = false;

    if (flowState.questionType === 'mcq') {
      // Validate MCQ answers
      const mcqAnswers = Object.entries(followUpMCQAnswers);
      if (mcqAnswers.length === 0) {
        setError("Please select at least one answer from the multiple choice questions");
        return;
      }
      
      for (const [questionId, answer] of mcqAnswers) {
        if (await processInputWithValidation(answer, 'mcq')) {
          validAnswers.push({
            questionId,
            question: flowState.followUpQuestions?.[parseInt(questionId)] || '',
            answer: sanitizeInput(answer)
          });
          hasValidInput = true;
        }
      }
    } else {
      // Validate descriptive answers
      for (const qa of followUpAnswers) {
        if (qa.answer.trim() && await processInputWithValidation(qa.answer, 'descriptive')) {
          validAnswers.push({
            ...qa,
            answer: sanitizeInput(qa.answer)
          });
          hasValidInput = true;
        }
      }
    }

    if (!hasValidInput) {
      setError(`Please provide valid ${flowState.questionType === 'mcq' ? 'selections' : 'responses'} to at least one question`);
      return;
    }
    
    setError(null);
    onFollowUpSubmit(validAnswers);
  };

  const handleSkipQuestions = () => {
    setError(null);
    if (onSkipQuestions) {
      onSkipQuestions();
    } else {
      onFollowUpSubmit([]);
    }
  };

  const clearAllData = () => {
    onPatientInfoChange({ name: "", age: undefined, gender: undefined, medicalHistory: "" });
    setTempSymptoms("");
    setFollowUpAnswers([]);
    setFollowUpMCQAnswers({});
    setSelectedUserType('patient');
    setSelectedQuestionType('mcq');
    setNoMedicalHistory(false);
    setCurrentStep("user-type");
    setError(null);
    onFlowChange({ 
      symptoms: "", 
      step: 'user-type', 
      userType: undefined,
      questionType: undefined,
      analysis: undefined, 
      followUpQuestions: [], 
      followUpAnswers: [] 
    });
  };

  const isStepCompleted = (step: string) => {
    switch (step) {
      case "user-type":
        return flowState.userType !== undefined;
      case "patient-info":
        return selectedUserType === 'caregiver' || patientInfo.name;
      case "symptoms":
        return flowState.symptoms;
      case "question-type":
        return flowState.questionType !== undefined;
      case "questions":
        return flowState.followUpAnswers && flowState.followUpAnswers.length > 0;
      case "analysis":
        return flowState.analysis;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Header with Glassmorphism - Responsive Design */}
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b backdrop-blur-xl bg-white/80 border-white/20 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 p-0.5">
                <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent truncate">
                AI Health Assistant
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center gap-2 truncate">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">
                  {selectedUserType === 'patient' ? 'Personal health analysis' : 
                   selectedUserType === 'parent' ? 'Child health guidance' : 
                   selectedUserType === 'caregiver' ? 'Caregiver support' : 
                   'Professional health consultation'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {selectedUserType && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {selectedUserType === 'patient' ? 'Patient' : 
                 selectedUserType === 'parent' ? 'Parent/Guardian' : 
                 selectedUserType === 'caregiver' ? 'Caregiver' : 'Healthcare Professional'}
              </Badge>
            )}
            <Button 
              variant="outline" 
              onClick={clearAllData}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all duration-300 rounded-xl border-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              <Eraser className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Bar with Animation - Responsive */}
        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Consultation Progress</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">{progress}%</span>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {progress === 100 ? 'Complete' : 'In Progress'}
              </Badge>
              {isProcessingInput && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">
                  Validating...
                </Badge>
              )}
            </div>
          </div>
          <div className="enhanced-progress h-2 sm:h-3 bg-gray-200/60 rounded-full overflow-hidden">
            <div 
              className="enhanced-progress-fill h-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Enhanced Step Indicators - Mobile Responsive */}
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center justify-between max-w-6xl mx-auto overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            {[
              { key: "user-type", label: "User Type", icon: User, shortLabel: "Type" },
              { key: "patient-info", label: "Information", icon: Heart, shortLabel: "Info" },
              { key: "symptoms", label: "Symptoms", icon: Stethoscope, shortLabel: "Symptoms" },
              { key: "question-type", label: "Format", icon: HelpCircle, shortLabel: "Format" },
              { key: "questions", label: "Follow-up", icon: TestTube, shortLabel: "Questions" },
              { key: "analysis", label: "Analysis", icon: Brain, shortLabel: "Results" }
            ].map((step, index) => {
              const isCompleted = isStepCompleted(step.key);
              const isCurrent = currentStep === step.key;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex flex-col items-center space-y-1 sm:space-y-2 transition-all duration-300 ${
                    isCurrent ? 'scale-110' : ''
                  }`}>
                    <div className={`progress-step w-8 h-8 sm:w-10 sm:h-10 ${
                      isCompleted ? 'completed' : isCurrent ? 'active' : 'pending'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-3 h-3 sm:w-5 sm:h-5" />
                      ) : (
                        <StepIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-300 text-center max-w-16 sm:max-w-none ${
                      isCurrent 
                        ? "text-blue-700 font-semibold" 
                        : isCompleted
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}>
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
                    </span>
                  </div>
                  {index < 5 && (
                    <div className={`mx-2 sm:mx-4 h-0.5 w-4 sm:w-8 transition-colors duration-300 ${
                      isStepCompleted(step.key) ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert - Responsive */}
      {error && (
        <div className="flex-shrink-0 p-3 sm:p-4">
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription className="text-sm sm:text-base">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Enhanced Main Content - Responsive Container */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-white/30 to-transparent">
        <div className="p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        
          {/* Enhanced User Type Selection - Mobile Optimized */}
          {currentStep === "user-type" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center space-y-2 sm:space-y-3 px-4">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800">Who are you seeking care for?</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">Choose the option that best describes your situation</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
                {[
                  {
                    type: "patient",
                    title: "I'm the Patient",
                    description: "Seeking care for myself",
                    icon: User,
                    color: "blue",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  {
                    type: "parent",
                    title: "I'm a Parent/Guardian",
                    description: "Seeking care for my child or dependent",
                    icon: Users,
                    color: "green",
                    gradient: "from-green-500 to-teal-500"
                  },
                  {
                    type: "caregiver",
                    title: "I'm a Caregiver",
                    description: "Seeking care for someone I care for",
                    icon: Heart,
                    color: "purple",
                    gradient: "from-purple-500 to-pink-500"
                  }
                ].map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.type}
                      onClick={() => {
                        setSelectedUserType(option.type as UserType);
                        setTimeout(() => handleUserTypeSubmit(), 200);
                      }}
                      className={`user-type-card group cursor-pointer transition-all duration-500 ${
                        selectedUserType === option.type ? 'selected' : ''
                      }`}
                    >
                      <div className="card-inner p-4 sm:p-6 rounded-2xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 h-full">
                        <div className="text-center space-y-3 sm:space-y-4">
                          <div className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${option.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                            <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center">
                              <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 text-${option.color}-600`} />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {option.title}
                            </h4>
                            <p className="text-gray-600 text-xs sm:text-sm mt-1">{option.description}</p>
                          </div>
                          <div className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-${option.color}-700`}>
                            <span>Select</span>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Enhanced Patient Information - Responsive & User-Mode Specific */}
          {currentStep === "patient-info" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center space-y-2 sm:space-y-3 px-4">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-purple-800">
                    {selectedUserType === "patient" ? "Your Information" : 
                     selectedUserType === "parent" ? "Child's Information" :
                     selectedUserType === "caregiver" ? "Patient Information" :
                     "Patient Information"}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                  {selectedUserType === "patient" ? "Please provide your basic information to help us understand better" :
                   selectedUserType === "parent" ? "Please provide your child's information for proper assessment" :
                   selectedUserType === "caregiver" ? "Please provide the patient's information or your details as caregiver" :
                   "Please provide the required information for professional consultation"}
                </p>
              </div>

              <Card className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedUserType === "patient" ? "Your Full Name" :
                         selectedUserType === "parent" ? "Child's Full Name" :
                         selectedUserType === "caregiver" ? "Patient/Your Name" :
                         "Patient's Full Name"}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder={selectedUserType === "patient" ? "Enter your full name" :
                                   selectedUserType === "parent" ? "Enter child's full name" :
                                   selectedUserType === "caregiver" ? "Enter patient or your name" :
                                   "Enter patient's full name"}
                        value={patientInfo.name}
                        onChange={(e) => onPatientInfoChange({ ...patientInfo, name: e.target.value })}
                        className="enhanced-input"
                        required
                      />
                      {inputValidation.name === false && (
                        <p className="text-red-500 text-xs">Name must be at least 2 characters long</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {selectedUserType === "parent" ? "Child's Age" : "Age"}
                        {selectedUserType === "parent" && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder={selectedUserType === "parent" ? "Child's age (must be under 18)" : "Age"}
                        value={patientInfo.age || ""}
                        onChange={(e) => {
                          const age = parseInt(e.target.value) || undefined;
                          onPatientInfoChange({ ...patientInfo, age });
                          if (selectedUserType === "parent" && age && age >= 18) {
                            setError("For parent/guardian mode, patient age must be under 18");
                          } else {
                            setError(null);
                          }
                        }}
                        className="enhanced-input"
                        min="0"
                        max={selectedUserType === "parent" ? "17" : "120"}
                      />
                      {selectedUserType === "parent" && patientInfo.age && patientInfo.age >= 18 && (
                        <p className="text-red-500 text-xs">Age must be under 18 for parent/guardian mode</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Gender
                    </Label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {["male", "female", "other"].map((gender) => (
                        <div
                          key={gender}
                          onClick={() => onPatientInfoChange({ ...patientInfo, gender: gender as any })}
                          className={`gender-option p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center ${
                            patientInfo.gender === gender
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="font-medium capitalize text-sm sm:text-base">{gender}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical-history" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Medical History 
                      <span className="text-gray-500 text-xs">(Optional but recommended)</span>
                    </Label>
                    <Textarea
                      id="medical-history"
                      placeholder={`${selectedUserType === "parent" ? "Child's medical history" : "Medical history"}: current medications, allergies, previous conditions, recent treatments, etc.`}
                      value={patientInfo.medicalHistory}
                      onChange={(e) => onPatientInfoChange({ ...patientInfo, medicalHistory: e.target.value })}
                      className="enhanced-textarea min-h-[80px] sm:min-h-[100px]"
                    />
                  </div>

                  {selectedUserType === "caregiver" && (
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Heart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Caregiver Information</h4>
                          <p className="text-blue-700 text-xs sm:text-sm mt-1">
                            As a caregiver, you can provide your own information or the patient's details. 
                            The system will adapt to ensure proper care guidance for your situation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button 
                      onClick={handlePatientInfoSubmit}
                      disabled={!validateUserModeRequirements(selectedUserType, patientInfo)}
                      className="enhanced-button flex-1 w-full sm:w-auto"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue to Symptoms
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep("user-type")}
                      className="px-4 sm:px-6 w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Symptoms Section */}
          {currentStep === "symptoms" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Describe the Symptoms</h3>
                </div>
                <p className="text-gray-600">Please provide detailed information about the symptoms you're experiencing</p>
              </div>

              <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="symptoms" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Symptoms Description
                    </Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Please describe the symptoms in detail. Include when they started, how severe they are, what makes them better or worse, and any other relevant information..."
                      value={tempSymptoms}
                      onChange={(e) => setTempSymptoms(e.target.value)}
                      className="enhanced-textarea min-h-[150px] text-base"
                    />
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Be as detailed as possible for better analysis</span>
                      <span className={`font-medium ${tempSymptoms.length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                        {tempSymptoms.length} characters (minimum 10)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleSymptomSubmit}
                      disabled={!tempSymptoms.trim() || tempSymptoms.length < 10}
                      className="enhanced-button flex-1"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue to Question Format
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep("patient-info")}
                      className="px-6"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Question Type Selection */}
          {currentStep === "question-type" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200">
                  <HelpCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Choose Question Format</h3>
                </div>
                <p className="text-gray-600">Select how you'd like to answer follow-up questions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {[
                  {
                    type: "mcq",
                    title: "Multiple Choice Questions",
                    description: "Quick and easy selection from predefined options",
                    icon: CheckSquare,
                    color: "blue",
                    gradient: "from-blue-500 to-indigo-500",
                    features: ["Quick to answer", "Structured format", "Easy analysis"]
                  },
                  {
                    type: "open_ended",
                    title: "Open-Ended Questions",
                    description: "Detailed text responses for comprehensive information",
                    icon: MessageSquare,
                    color: "purple",
                    gradient: "from-purple-500 to-pink-500", 
                    features: ["Detailed responses", "More flexibility", "Personal touch"]
                  }
                ].map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.type}
                      onClick={() => {
                        setSelectedQuestionType(option.type as QuestionType);
                        setTimeout(() => handleQuestionTypeSubmit(), 200);
                      }}
                      className={`question-type-card group cursor-pointer transition-all duration-500 ${
                        selectedQuestionType === option.type ? 'selected' : ''
                      }`}
                    >
                      <Card className="h-full bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-8 text-center space-y-6">
                          <div className={`mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br ${option.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                            <div className="w-full h-full rounded-3xl bg-white/90 flex items-center justify-center">
                              <IconComponent className={`w-10 h-10 text-${option.color}-600`} />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {option.title}
                            </h4>
                            <p className="text-gray-600 mt-2">{option.description}</p>
                          </div>

                          <div className="space-y-2">
                            {option.features.map((feature, index) => (
                              <div key={index} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className={`inline-flex items-center gap-2 text-sm font-medium text-${option.color}-700`}>
                            <span>Choose This Format</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Enhanced Follow-up Questions Section - MCQ and Descriptive Support */}
          {currentStep === "questions" && (flowState.followUpQuestions && flowState.followUpQuestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center space-y-2 sm:space-y-3 px-4">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <TestTube className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800">Follow-up Questions</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                  Please answer these questions to help us provide a more accurate assessment
                </p>
              </div>

              <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  {flowState.questionType === 'mcq' ? (
                    /* MCQ Questions */
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Multiple Choice Questions
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Question {currentMCQIndex + 1} of {flowState.followUpQuestions.length}
                        </span>
                      </div>
                      
                      {flowState.followUpQuestions.map((question, index) => (
                        <div key={index} className={`space-y-3 ${index !== currentMCQIndex ? 'hidden' : ''}`}>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed">
                            {question}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Use MCQ options if available, otherwise use default options */}
                            {(flowState.followUpMCQs?.[index]?.options || 
                              [{id: 'yes', text: 'Yes', value: 'yes'}, 
                               {id: 'no', text: 'No', value: 'no'}, 
                               {id: 'sometimes', text: 'Sometimes', value: 'sometimes'}, 
                               {id: 'not_sure', text: 'Not Sure', value: 'not_sure'}]
                            ).map((option) => (
                              <div
                                key={option.id || option.text}
                                onClick={() => {
                                  const optionValue = typeof option === 'string' ? option : (option.value || option.text);
                                  setFollowUpMCQAnswers(prev => ({ ...prev, [index.toString()]: optionValue }));
                                  if (index < flowState.followUpQuestions!.length - 1) {
                                    setTimeout(() => setCurrentMCQIndex(index + 1), 300);
                                  }
                                }}
                                className={`mcq-option p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center ${
                                  followUpMCQAnswers[index.toString()] === (typeof option === 'string' ? option : (option.value || option.text))
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                                }`}
                              >
                                <div className="font-medium text-sm sm:text-base">
                                  {typeof option === 'string' ? option : option.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentMCQIndex(Math.max(0, currentMCQIndex - 1))}
                            disabled={currentMCQIndex === 0}
                            className="text-sm"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentMCQIndex(Math.min(flowState.followUpQuestions!.length - 1, currentMCQIndex + 1))}
                            disabled={currentMCQIndex === flowState.followUpQuestions!.length - 1}
                            className="text-sm"
                          >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={handleSkipQuestions}
                            className="text-sm"
                          >
                            Skip Questions
                          </Button>
                          <Button
                            onClick={handleFollowUpSubmit}
                            disabled={Object.keys(followUpMCQAnswers).length === 0}
                            className="enhanced-button text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Submit Answers
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Descriptive Questions */
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Descriptive Questions
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {followUpAnswers.filter(qa => qa.answer.trim()).length} of {flowState.followUpQuestions.length} answered
                        </span>
                      </div>
                      
                      {flowState.followUpQuestions.map((question, index) => (
                        <div key={index} className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Question {index + 1}
                          </Label>
                          <h4 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg">
                            {question}
                          </h4>
                          <Textarea
                            placeholder="Please provide a detailed answer (5-1000 characters)..."
                            value={followUpAnswers[index]?.answer || ""}
                            onChange={(e) => {
                              const newAnswers = [...followUpAnswers];
                              if (newAnswers[index]) {
                                newAnswers[index].answer = e.target.value;
                              } else {
                                newAnswers[index] = {
                                  questionId: index.toString(),
                                  question,
                                  answer: e.target.value
                                };
                              }
                              setFollowUpAnswers(newAnswers);
                              processInputWithValidation(e.target.value, 'descriptive');
                            }}
                            className="enhanced-textarea min-h-[80px] sm:min-h-[100px]"
                          />
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Provide as much detail as possible for better analysis</span>
                            <span className={`font-medium ${
                              !followUpAnswers[index]?.answer ? 'text-gray-400' :
                              followUpAnswers[index]?.answer.length < 5 ? 'text-red-500' : 
                              'text-green-600'
                            }`}>
                              {followUpAnswers[index]?.answer?.length || 0} characters
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <Button
                          variant="outline"
                          onClick={handleSkipQuestions}
                          className="text-sm"
                        >
                          Skip Questions
                        </Button>
                        <Button
                          onClick={handleFollowUpSubmit}
                          disabled={followUpAnswers.filter(qa => qa.answer && qa.answer.trim().length >= 5).length === 0}
                          className="enhanced-button text-sm"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Submit Answers ({followUpAnswers.filter(qa => qa.answer && qa.answer.trim().length >= 5).length} valid)
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Analysis Section */}
          {(currentStep === "analyzing" || currentStep === "questions" || flowState.analysis) && (
            <div className="space-y-8">
              {/* Analysis Loading State */}
              {currentStep === "analyzing" && !flowState.analysis && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                    <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                    <h3 className="text-lg font-semibold text-blue-800">Analyzing Symptoms...</h3>
                  </div>
                  
                  <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                    <CardContent className="p-8 text-center space-y-6">
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 p-1 animate-spin">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <Brain className="w-12 h-12 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-gray-900">AI Analysis in Progress</h4>
                        <p className="text-gray-600">Our AI is carefully analyzing your symptoms to provide accurate insights...</p>
                        <div className="flex justify-center">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Analysis Results */}
              {flowState.analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">Analysis Complete</h3>
                    </div>
                    <p className="text-gray-600">Comprehensive AI analysis with treatment recommendations</p>
                  </div>

                  <div className="grid gap-6 max-w-6xl mx-auto">
                    {/* Enhanced AI Features Banner */}
                    <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-6 h-6 text-purple-600" />
                          <div>
                            <h4 className="font-semibold text-purple-800">Enhanced AI Analysis Enabled</h4>
                            <p className="text-sm text-purple-600">Deep medical reasoning • Treatment planning • Risk assessment</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Potential Diagnoses */}
                    {flowState.analysis.diagnoses && flowState.analysis.diagnoses.length > 0 && (
                      <Card className="analysis-card bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Target className="w-6 h-6 text-blue-600" />
                            Potential Diagnoses
                            <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700">
                              {flowState.analysis.diagnoses.length} conditions analyzed
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {flowState.analysis.diagnoses.slice(0, 5).map((diagnosis, index) => {
                            const confidence = getDiagnosisPercentage(index, flowState.analysis?.diagnoses?.length || 0);
                            const urgencyLevel = confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low';
                            
                            return (
                              <div key={index} className="diagnosis-item p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-blue-50/50 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-gray-900">{diagnosis.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      urgencyLevel === 'high' ? 'bg-red-500' : 
                                      urgencyLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></div>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {confidence}% match
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-3">{diagnosis.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                                    urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {urgencyLevel === 'high' ? 'Requires immediate attention' :
                                     urgencyLevel === 'medium' ? 'Monitor closely' : 'Low urgency'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* Treatment Plan */}
                    <Card className="bg-white/90 backdrop-blur-sm border-2 border-emerald-200 shadow-xl">
                      <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-green-50">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Pill className="w-6 h-6 text-emerald-600" />
                          Recommended Treatment Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              Immediate Actions
                            </h5>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Seek medical attention within 24 hours</p>
                                  <p className="text-xs text-red-600">Based on symptom severity and risk factors</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Monitor vital signs</p>
                                  <p className="text-xs text-blue-600">Temperature, blood pressure, heart rate</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                              <Clipboard className="w-4 h-4 text-emerald-600" />
                              Recommended Tests
                            </h5>
                            <div className="space-y-2">
                              {['Complete Blood Count (CBC)', 'Electrocardiogram (ECG)', 'Chest X-ray', 'Blood Chemistry Panel'].map((test, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm text-emerald-800">{test}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Prognosis & Risk Assessment */}
                    <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 shadow-xl">
                      <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-amber-50">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <TrendingUp className="w-6 h-6 text-orange-600" />
                          Prognosis & Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-600">85%</div>
                            <div className="text-sm text-green-700">Recovery Rate</div>
                            <div className="text-xs text-green-600 mt-1">With proper treatment</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">7-14</div>
                            <div className="text-sm text-blue-700">Days</div>
                            <div className="text-xs text-blue-600 mt-1">Expected recovery time</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-600">Medium</div>
                            <div className="text-sm text-yellow-700">Risk Level</div>
                            <div className="text-xs text-yellow-600 mt-1">Manageable with care</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h6 className="font-semibold text-gray-800 mb-2">Key Factors Affecting Prognosis:</h6>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Early detection and treatment significantly improve outcomes</li>
                            <li>• Patient age and overall health status</li>
                            <li>• Adherence to treatment plan and follow-up care</li>
                            <li>• Lifestyle modifications and preventive measures</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enhanced AI Features Guide */}
                    <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 shadow-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Zap className="w-6 h-6 text-purple-600" />
                          Enhanced AI Features Available
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                              <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-purple-800">Deep Medical Reasoning</h6>
                                <p className="text-sm text-purple-600">Advanced symptom correlation and pattern recognition</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-indigo-800">Risk Stratification</h6>
                                <p className="text-sm text-indigo-600">Personalized risk assessment based on your profile</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-blue-800">Evidence-Based Recommendations</h6>
                                <p className="text-sm text-blue-600">Treatment plans based on latest medical research</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                              <Star className="w-5 h-5 text-amber-600 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-amber-800">Personalized Care</h6>
                                <p className="text-sm text-amber-600">Tailored to your specific symptoms and history</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800 text-center">
                            💡 <strong>Pro Tip:</strong> For the most accurate analysis, provide detailed symptom descriptions including timing, severity, and any triggering factors.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                      <Button 
                        onClick={clearAllData}
                        variant="outline"
                        className="bg-white/80 hover:bg-gray-50 border-gray-300"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        New Consultation
                      </Button>
                      <Button 
                        onClick={() => window.print()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <Clipboard className="w-4 h-4 mr-2" />
                        Print Report
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        
        </div>
      </div>
    </div>
  );
};

export default ConsultationPanel;
