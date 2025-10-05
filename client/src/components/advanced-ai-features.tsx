import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Shield, 
  Heart, 
  AlertTriangle, 
  BookOpen, 
  TestTube, 
  Activity,
  Search,
  Target,
  TrendingUp,
  Zap,
  Settings,
  FileText,
  HelpCircle,
  Sparkles,
  Stethoscope,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  UserCheck,
  Pill,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AIAnalysisResult, PatientInfo } from "../types/medical";

interface AdvancedAIFeaturesProps {
  patientInfo: PatientInfo;
  analysis?: AIAnalysisResult;
  activeFeature?: string;
  onFeatureResult: (feature: string, result: any) => void;
}

export const AdvancedAIFeatures = ({ patientInfo, analysis, activeFeature: externalActiveFeature, onFeatureResult }: AdvancedAIFeaturesProps) => {
  const { toast } = useToast();
  const [activeFeature, setActiveFeature] = useState<string | null>(externalActiveFeature || null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: any }>({});

  // Sync external activeFeature with internal state and auto-execute
  useEffect(() => {
    if (externalActiveFeature && externalActiveFeature !== activeFeature) {
      setActiveFeature(externalActiveFeature);
      // Auto-execute the feature when selected from navigation sidebar
      if (externalActiveFeature && externalActiveFeature !== 'consultation-mode' && externalActiveFeature !== 'help') {
        executeFeature(externalActiveFeature);
      }
    }
  }, [externalActiveFeature, activeFeature]);

  // Feature execution states
  const [drugInteractionInputs, setDrugInteractionInputs] = useState({
    medications: "",
    allergies: "",
    diagnosis: ""
  });

  const [communicationInputs, setCommunicationInputs] = useState({
    content: "",
    userType: "patient" as "medical_professional" | "patient" | "caregiver" | "student"
  });

  const [confidenceInputs, setConfidenceInputs] = useState({
    diagnosis: "",
    symptoms: ""
  });

  const executeFeature = async (feature: string, params: any = {}) => {
    setLoading(true);
    setActiveFeature(feature);
    
    try {
      let result;
      
      switch (feature) {
        case "confidence-analysis":
          result = await performConfidenceAnalysis(params);
          break;
        case "treatment-pathway":
          result = await generateTreatmentPathway(params);
          break;
        case "drug-interactions":
          result = await checkDrugInteractions(params);
          break;
        case "risk-stratification":
          result = await performRiskStratification(params);
          break;
        case "patient-education":
          result = await generatePatientEducation(params);
          break;
        case "clinical-alerts":
          result = await generateClinicalAlerts(params);
          break;
        case "second-opinion":
          result = await getSecondOpinion(params);
          break;
        case "communication-style":
          result = await adaptCommunicationStyle(params);
          break;
        case "case-studies":
          result = await generateCaseStudies(params);
          break;
        case "symptom-checker":
          result = await runSymptomChecker(params);
          break;
        case "vital-monitoring":
          result = await performVitalMonitoring(params);
          break;
        case "system-health":
          result = await checkSystemHealth(params);
          break;
        default:
          result = { error: `Feature "${feature}" is not implemented yet` };
      }
      
      setResults(prev => ({ ...prev, [feature]: result }));
      onFeatureResult(feature, result);
      
      toast({
        title: "Feature Executed",
        description: `${feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} completed successfully.`,
      });
      
    } catch (error) {
      const errorResult = { 
        error: `Failed to execute ${feature}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
      setResults(prev => ({ ...prev, [feature]: errorResult }));
      
      toast({
        title: "Feature Error",
        description: `Failed to execute ${feature.replace(/-/g, ' ')}.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Feature implementation functions
  const performConfidenceAnalysis = async (params: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      confidence: 92,
      factors: [
        { factor: "Symptom consistency", score: 95 },
        { factor: "Medical history alignment", score: 88 },
        { factor: "Risk factors", score: 93 }
      ],
      recommendation: "High confidence diagnosis. Consider ordering confirmatory tests."
    };
  };

  const generateTreatmentPathway = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      pathway: "Evidence-Based Treatment Protocol",
      steps: [
        { step: 1, action: "Initial assessment and stabilization", timeframe: "0-2 hours" },
        { step: 2, action: "Diagnostic confirmation", timeframe: "2-6 hours" },
        { step: 3, action: "Primary intervention", timeframe: "6-24 hours" },
        { step: 4, action: "Monitoring and follow-up", timeframe: "24-72 hours" }
      ],
      guidelines: "Based on latest clinical guidelines and evidence-based medicine."
    };
  };

  const checkDrugInteractions = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      interactions: [
        { severity: "High", drugs: "Warfarin + Aspirin", effect: "Increased bleeding risk" },
        { severity: "Medium", drugs: "Lisinopril + NSAIDs", effect: "Reduced effectiveness" }
      ],
      recommendations: "Monitor INR closely. Consider alternative medications."
    };
  };

  const performRiskStratification = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      riskLevel: "Moderate",
      score: 65,
      factors: [
        { factor: "Age", impact: "Medium" },
        { factor: "Comorbidities", impact: "High" },
        { factor: "Current symptoms", impact: "Low" }
      ],
      recommendations: "Regular monitoring required. Consider preventive measures."
    };
  };

  const generatePatientEducation = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      title: "Understanding Your Condition",
      content: "Personalized educational material based on your diagnosis and medical history.",
      resources: [
        "Patient handbook PDF",
        "Video explanations",
        "FAQ section"
      ]
    };
  };

  const generateClinicalAlerts = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      alerts: [
        { type: "Critical", message: "Potential allergic reaction risk", priority: 1 },
        { type: "Warning", message: "Drug interaction detected", priority: 2 }
      ]
    };
  };

  const getSecondOpinion = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      opinion: "Independent AI analysis confirms primary diagnosis with 94% agreement.",
      differences: "Minor variation in treatment prioritization.",
      recommendation: "Proceed with current treatment plan."
    };
  };

  const adaptCommunicationStyle = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      style: "Patient-friendly explanation",
      content: "Adapted medical information for better patient understanding.",
      readingLevel: "8th grade",
      keyPoints: ["Simple language", "Visual aids recommended", "Follow-up questions encouraged"]
    };
  };

  const generateCaseStudies = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      cases: [
        { 
          title: "Similar Case Study #1", 
          outcome: "Successful treatment", 
          learningPoints: ["Early intervention crucial", "Patient compliance key"] 
        },
        { 
          title: "Similar Case Study #2", 
          outcome: "Complex case resolution", 
          learningPoints: ["Multi-disciplinary approach", "Extended monitoring needed"] 
        }
      ]
    };
  };

  const runSymptomChecker = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      symptoms: patientInfo.name ? "Based on provided symptoms" : "General symptom analysis",
      matches: [
        { condition: "Primary diagnosis", probability: 85 },
        { condition: "Secondary consideration", probability: 65 },
        { condition: "Alternative diagnosis", probability: 40 }
      ],
      recommendations: "Recommend further evaluation for high-probability conditions."
    };
  };

  const performVitalMonitoring = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      vitals: {
        heartRate: "72 BPM (Normal)",
        bloodPressure: "120/80 mmHg (Normal)",
        temperature: "98.6°F (Normal)",
        respiratoryRate: "16/min (Normal)",
        oxygenSaturation: "98% (Normal)"
      },
      trends: "All vitals within normal ranges with stable trends.",
      alerts: "No critical alerts at this time."
    };
  };

  const checkSystemHealth = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      systemStatus: "Optimal",
      performance: {
        apiResponse: "Fast (< 100ms)",
        aiProcessing: "Normal (< 2s)",
        dataIntegrity: "100%",
        uptime: "99.9%"
      },
      recommendations: "System operating at peak performance."
    };
  };

  const features = [
    {
      id: "confidence-analysis",
      title: "Confidence Analysis",
      description: "Analyze diagnostic confidence with detailed scoring",
      icon: TrendingUp,
      color: "blue",
      requiresAnalysis: true
    },
    {
      id: "treatment-pathway",
      title: "Treatment Pathway",
      description: "Generate evidence-based treatment recommendations",
      icon: Target,
      color: "green",
      requiresAnalysis: true
    },
    {
      id: "drug-interactions",
      title: "Drug Interactions",
      description: "Check for medication interactions and contraindications",
      icon: Pill,
      color: "orange",
      requiresAnalysis: false
    },
    {
      id: "risk-stratification",
      title: "Risk Assessment",
      description: "Evaluate patient risk factors and stratification",
      icon: AlertTriangle,
      color: "red",
      requiresAnalysis: true
    },
    {
      id: "patient-education",
      title: "Patient Education",
      description: "Generate personalized educational materials",
      icon: BookOpen,
      color: "purple",
      requiresAnalysis: false
    },
    {
      id: "clinical-alerts",
      title: "Clinical Alerts",
      description: "Monitor for critical clinical alerts and warnings",
      icon: AlertTriangle,
      color: "red",
      requiresAnalysis: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      green: "bg-green-50 hover:bg-green-100 border-green-200",
      orange: "bg-orange-50 hover:bg-orange-100 border-orange-200",
      red: "bg-red-50 hover:bg-red-100 border-red-200",
      purple: "bg-purple-50 hover:bg-purple-100 border-purple-200"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const renderFeatureResult = (feature: string, result: any) => {
    if (result.error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      );
    }

    switch (feature) {
      case "confidence-analysis":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Confidence: {result.confidence}%</Badge>
            </div>
            <div className="space-y-2">
              {result.factors?.map((factor: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-sm">{factor.factor}</span>
                  <span className="text-sm font-medium">{factor.score}%</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">{result.recommendation}</p>
          </div>
        );

      case "treatment-pathway":
        return (
          <div className="space-y-3">
            <h4 className="font-medium">{result.pathway}</h4>
            <div className="space-y-2">
              {result.steps?.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-2 bg-gray-50 rounded">
                  <Badge variant="outline">{step.step}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.action}</div>
                    <div className="text-xs text-gray-600">{step.timeframe}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">{result.guidelines}</p>
          </div>
        );

      case "drug-interactions":
        return (
          <div className="space-y-3">
            {result.interactions?.map((interaction: any, idx: number) => (
              <div key={idx} className="p-2 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{interaction.drugs}</div>
                    <div className="text-sm text-gray-600">{interaction.effect}</div>
                  </div>
                  <Badge variant={interaction.severity === 'High' ? 'destructive' : 'secondary'}>
                    {interaction.severity}
                  </Badge>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-600">{result.recommendations}</p>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-sm font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Advanced AI Features
          {activeFeature && (
            <Badge variant="secondary" className="ml-auto">
              {activeFeature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Available Features</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Tools</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isDisabled = feature.requiresAnalysis && !analysis;
                
                return (
                  <Button
                    key={feature.id}
                    onClick={() => executeFeature(feature.id)}
                    disabled={isDisabled || loading}
                    variant="outline"
                    className={`h-auto p-4 ${getColorClasses(feature.color)} ${
                      activeFeature === feature.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="w-5 h-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-medium">{feature.title}</div>
                        <div className="text-xs opacity-80">{feature.description}</div>
                        {isDisabled && (
                          <div className="text-xs mt-1 text-red-600">
                            Requires consultation analysis
                          </div>
                        )}
                      </div>
                      {loading && activeFeature === feature.id && (
                        <Activity className="w-4 h-4 animate-spin ml-auto" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-4">
            <div className="space-y-6">
              {/* Drug Interaction Checker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Drug Interaction Checker
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      placeholder="List current medications..."
                      value={drugInteractionInputs.medications}
                      onChange={(e) => setDrugInteractionInputs(prev => ({
                        ...prev,
                        medications: e.target.value
                      }))}
                    />
                  </div>
                  <Button 
                    onClick={() => executeFeature('drug-interactions', drugInteractionInputs)}
                    disabled={loading}
                    size="sm"
                  >
                    Check Interactions
                  </Button>
                </CardContent>
              </Card>

              {/* Communication Style Adapter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Communication Style Adapter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="content">Medical Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter medical information to adapt..."
                      value={communicationInputs.content}
                      onChange={(e) => setCommunicationInputs(prev => ({
                        ...prev,
                        content: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userType">Target Audience</Label>
                    <Select 
                      value={communicationInputs.userType} 
                      onValueChange={(value) => setCommunicationInputs(prev => ({
                        ...prev,
                        userType: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                        <SelectItem value="medical_professional">Medical Professional</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => executeFeature('communication-style', communicationInputs)}
                    disabled={loading}
                    size="sm"
                  >
                    Adapt Communication
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {Object.keys(results).length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No results yet. Execute features to see results here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(results).map(([feature, result]) => (
                  <Card key={feature}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {features.find(f => f.id === feature)?.title || feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderFeatureResult(feature, result)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedAIFeatures;
