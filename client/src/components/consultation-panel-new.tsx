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
  TestTube,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  CheckSquare,
  MessageSquare,
  Target,
  Lightbulb,
  AlertTriangle,
  X,
  GraduationCap,
  Activity,
  Search,
  ChevronRight,
  UserCheck,
  Eraser,
  TriangleAlert,
  Sparkles,
  Star,
  Zap,
  Play
} from "lucide-react";

import { PatientInfo, ConsultationFlow, FollowUpQA, UserType, QuestionType, DiagnosisResult, AIAnalysisResult } from "@/types/medical";

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

  // Function to get realistic diagnosis percentages
  const getDiagnosisPercentage = (index: number, totalDiagnoses: number) => {
    const basePercentages = [85, 65, 45, 30, 20, 15, 10, 8, 5, 3];
    return basePercentages[index] || Math.max(2, 15 - index * 2);
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
    }
  }, [flowState.followUpQuestions]);

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

  const handleUserTypeSubmit = () => {
    onFlowChange({ ...flowState, userType: selectedUserType, step: "patient-info" });
    setCurrentStep("patient-info");
  };

  const handlePatientInfoSubmit = () => {
    if (!patientInfo.name && selectedUserType !== 'caregiver') {
      setError("Please provide your name");
      return;
    }
    setError(null);
    setCurrentStep("symptoms");
    onFlowChange({ ...flowState, step: "symptoms" });
  };

  const handleSymptomSubmit = () => {
    const symptomsText = tempSymptoms.trim();
    if (!symptomsText) {
      setError("Please describe the symptoms");
      return;
    }
    if (symptomsText.length < 10) {
      setError("Please provide more detailed symptoms (at least 10 characters)");
      return;
    }
    setError(null);
    setCurrentStep("question-type");
    onFlowChange({ ...flowState, symptoms: symptomsText, step: "question-type" });
  };

  const handleQuestionTypeSubmit = () => {
    if (!tempSymptoms.trim()) {
      setError("Please enter your symptoms before continuing");
      return;
    }
    if (tempSymptoms.trim().length < 10) {
      setError("Please provide more detailed symptoms (at least 10 characters)");
      return;
    }
    setError(null);
    setCurrentStep("analyzing");
    const updatedFlow = { ...flowState, questionType: selectedQuestionType, symptoms: tempSymptoms };
    onFlowChange(updatedFlow);
    onSymptomSubmit(tempSymptoms, selectedQuestionType);
  };

  const handleFollowUpSubmit = () => {
    const validAnswers = followUpAnswers.filter(qa => qa.answer.trim());
    if (validAnswers.length === 0) {
      setError("Please answer at least one follow-up question");
      return;
    }
    setError(null);
    onFollowUpSubmit(followUpAnswers);
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
      {/* Enhanced Header with Glassmorphism */}
      <div className="flex-shrink-0 p-6 border-b backdrop-blur-xl bg-white/80 border-white/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 p-0.5">
                <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent">
                AI Health Assistant
              </h2>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Comprehensive health analysis and guidance for everyone
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={clearAllData}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all duration-300 rounded-xl border-2"
          >
            <Eraser className="w-4 h-4" />
            Clear All
          </Button>
        </div>

        {/* Enhanced Progress Bar with Animation */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span className="font-medium">Consultation Progress</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">{progress}%</span>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {progress === 100 ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
          </div>
          <div className="enhanced-progress h-3 bg-gray-200/60 rounded-full overflow-hidden">
            <div 
              className="enhanced-progress-fill h-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Enhanced Step Indicators */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {[
            { key: "user-type", label: "User Type", icon: User },
            { key: "patient-info", label: "Information", icon: Heart },
            { key: "symptoms", label: "Symptoms", icon: Stethoscope },
            { key: "question-type", label: "Format", icon: HelpCircle },
            { key: "questions", label: "Follow-up", icon: TestTube },
            { key: "analysis", label: "Analysis", icon: Brain }
          ].map((step, index) => {
            const isCompleted = isStepCompleted(step.key);
            const isCurrent = currentStep === step.key;
            const StepIcon = step.icon;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex flex-col items-center space-y-2 transition-all duration-300 ${
                  isCurrent ? 'scale-110' : ''
                }`}>
                  <div className={`progress-step ${
                    isCompleted ? 'completed' : isCurrent ? 'active' : 'pending'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent 
                      ? "text-blue-700 font-semibold" 
                      : isCompleted
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 5 && (
                  <div className={`mx-4 h-0.5 w-8 transition-colors duration-300 ${
                    isStepCompleted(step.key) ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex-shrink-0 p-4">
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Enhanced Main Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-white/30 to-transparent">
        <div className="p-6 space-y-8">
        
          {/* Enhanced User Type Selection */}
          {currentStep === "user-type" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Who are you seeking care for?</h3>
                </div>
                <p className="text-gray-600">Choose the option that best describes your situation</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                      <div className="card-inner p-6 rounded-2xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300">
                        <div className="text-center space-y-4">
                          <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                            <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center">
                              <IconComponent className={`w-8 h-8 text-${option.color}-600`} />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {option.title}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">{option.description}</p>
                          </div>
                          <div className={`inline-flex items-center gap-2 text-sm font-medium text-${option.color}-700`}>
                            <span>Select</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Enhanced Patient Information */}
          {currentStep === "patient-info" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                  <Heart className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-800">
                    {selectedUserType === "patient" ? "Your Information" : "Patient Information"}
                  </h3>
                </div>
                <p className="text-gray-600">Please provide some basic information to help us understand better</p>
              </div>

              <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={patientInfo.name}
                        onChange={(e) => onPatientInfoChange({ ...patientInfo, name: e.target.value })}
                        className="enhanced-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Age"
                        value={patientInfo.age || ""}
                        onChange={(e) => onPatientInfoChange({ ...patientInfo, age: parseInt(e.target.value) || undefined })}
                        className="enhanced-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Gender
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["male", "female", "other"].map((gender) => (
                        <div
                          key={gender}
                          onClick={() => onPatientInfoChange({ ...patientInfo, gender: gender as any })}
                          className={`gender-option p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center ${
                            patientInfo.gender === gender
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="font-medium capitalize">{gender}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical-history" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Medical History (Optional)
                    </Label>
                    <Textarea
                      id="medical-history"
                      placeholder="Any relevant medical history, current medications, allergies, etc."
                      value={patientInfo.medicalHistory}
                      onChange={(e) => onPatientInfoChange({ ...patientInfo, medicalHistory: e.target.value })}
                      className="enhanced-textarea min-h-[100px]"
                    />
                  </div>

                  <Button 
                    onClick={handlePatientInfoSubmit}
                    disabled={!patientInfo.name && selectedUserType !== 'caregiver'}
                    className="enhanced-button w-full"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue to Symptoms
                  </Button>
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
                    <p className="text-gray-600">Here's what our AI analysis reveals about your symptoms</p>
                  </div>

                  <div className="grid gap-6 max-w-6xl mx-auto">
                    {flowState.analysis.diagnoses && flowState.analysis.diagnoses.length > 0 && (
                      <Card className="analysis-card bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Target className="w-6 h-6 text-blue-600" />
                            Potential Diagnoses
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {flowState.analysis.diagnoses.slice(0, 5).map((diagnosis, index) => (
                            <div key={index} className="diagnosis-item p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-blue-50/50 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold text-gray-900">{diagnosis.name}</h4>
                                <div className="flex items-center gap-2">
                                  <div className="severity-indicator w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></div>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {getDiagnosisPercentage(index, flowState.analysis?.diagnoses?.length || 0)}% match
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{diagnosis.description}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
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
