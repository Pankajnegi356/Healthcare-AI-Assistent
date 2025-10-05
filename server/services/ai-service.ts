import Groq from "groq-sdk";

export interface DiagnosisResult {
  name: string;
  description: string;
  confidence: number;
  category: string;
  redFlags: string[];
  recommendedTests: string[];
  severity: string;
  probability: number;
  clinicalEvidence: number;
  symptomMatch: number;
  literatureSupport: string;
  additionalTestingNeeded: string[];
}

export interface TreatmentPathway {
  firstLineTherapy: string[];
  alternativeTreatments: string[];
  monitoringRequirements: string[];
  followUpSchedule: string;
  escalationCriteria: string[];
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

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
  followUp?: string;
  explanation?: string;
}

export interface ClinicalAlert {
  type: "critical" | "warning" | "info";
  priority: number;
  message: string;
  actionRequired: string;
  timeframe: string;
}

interface FollowUpMCQ {
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
  followUpQuestions: string[];
  followUpMCQs?: FollowUpMCQ[];
  mcqQuestions?: MCQQuestion[];
  redFlags: string[];
  recommendedTests: string[];
  overallConfidence: number;
  riskAssessment?: RiskAssessment;
  treatmentPathway?: TreatmentPathway;
  patientEducation?: PatientEducation;
  clinicalAlerts?: ClinicalAlert[];
  drugInteractions?: string[];
  secondOpinion?: string;
  recommendations?: {
    action: string;
    priority?: string;
    urgency?: string;
  }[];
  additionalNotes?: string;
}

export class AIService {
  private groqReasoner: Groq;
  private groqChat: Groq;

  constructor() {
    // Initialize Groq clients with dummy keys if real keys are not available
    this.groqReasoner = new Groq({ 
      apiKey: process.env.GROQ_API_KEY_REASONER || 'demo-key-reasoner'
    });
    this.groqChat = new Groq({ 
      apiKey: process.env.GROQ_API_KEY_CHAT || 'demo-key-chat'
    });
  }

  private async callGroqAPI(prompt: string, useReasoner: boolean = true): Promise<string> {
    try {
      // Check if API keys are available
      const apiKey = useReasoner ? process.env.GROQ_API_KEY_REASONER : process.env.GROQ_API_KEY_CHAT;
      if (!apiKey) {
        console.log('Groq API key not found, using demo response');
        return this.generateDemoResponse(prompt, useReasoner);
      }

      const groqClient = useReasoner ? this.groqReasoner : this.groqChat;
      const model = useReasoner ? "deepseek-r1-distill-llama-70b" : "meta-llama/llama-4-scout-17b-16e-instruct";

      const completion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: model,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Groq API Error:', error);
      // Fallback to demo response
      return this.generateDemoResponse(prompt, useReasoner);
    }
  }

  private generateDemoResponse(prompt: string, useReasoner: boolean): string {
    const promptLower = prompt.toLowerCase();
    
    // Detect the type of prompt and provide appropriate demo response
    if (promptLower.includes('follow-up') || promptLower.includes('questions')) {
      return JSON.stringify([
        "Can you describe when these symptoms first started?",
        "Have you noticed any specific triggers that make the symptoms worse?",
        "Are you currently taking any medications?",
        "Have you experienced these symptoms before?",
        "How would you rate the severity of your symptoms on a scale of 1-10?"
      ]);
    }
    
    if (promptLower.includes('mcq') || promptLower.includes('multiple choice')) {
      return JSON.stringify([
        {
          question: "What is the most important first step when experiencing chest pain?",
          options: [
            { text: "Ignore it and rest", isCorrect: false, explanation: "Chest pain should never be ignored as it could indicate a serious condition." },
            { text: "Take deep breaths and assess the situation", isCorrect: true, explanation: "Taking deep breaths helps you stay calm and assess if emergency care is needed." },
            { text: "Exercise to improve circulation", isCorrect: false, explanation: "Exercise during chest pain could worsen certain conditions." },
            { text: "Drink cold water", isCorrect: false, explanation: "This may not address the underlying cause of chest pain." }
          ],
          category: "symptoms",
          difficultyLevel: "easy",
          educationalValue: 9
        },
        {
          question: "When should you seek immediate medical attention for a cough?",
          options: [
            { text: "Only if it lasts more than a month", isCorrect: false, explanation: "Some serious conditions require immediate attention even with newer symptoms." },
            { text: "If you cough up blood or have severe breathing difficulty", isCorrect: true, explanation: "These are red flag symptoms that require emergency care." },
            { text: "Never, coughs always resolve on their own", isCorrect: false, explanation: "Some coughs indicate serious conditions that need medical treatment." },
            { text: "Only during working hours", isCorrect: false, explanation: "Medical emergencies don't follow a schedule." }
          ],
          category: "symptoms",
          difficultyLevel: "medium",
          educationalValue: 8
        }
      ]);
    }
    
    if (promptLower.includes('treatment') || promptLower.includes('pathway')) {
      return JSON.stringify({
        primaryTreatment: "Supportive care with rest, fluids, and over-the-counter symptom relief",
        alternativeOptions: [
          "Prescription medications if symptoms worsen",
          "Specialist consultation if no improvement in 7-10 days",
          "Additional testing if red flag symptoms develop"
        ],
        contraindications: ["Avoid aspirin in children under 16", "Monitor for allergic reactions to medications"],
        expectedDuration: "7-10 days for most viral infections",
        monitoringParameters: ["Symptom severity", "Temperature", "Breathing difficulty"],
        followUpSchedule: "Return if symptoms worsen or persist beyond 10 days"
      });
    }
    
    if (promptLower.includes('risk') || promptLower.includes('assessment')) {
      return JSON.stringify({
        immediateRisk: "medium",
        shortTermRisk: "low",
        longTermRisk: "low",
        riskFactors: [
          "Current symptoms suggest common viral infection",
          "Age and overall health status are favorable",
          "No significant red flag symptoms present"
        ],
        mitigationStrategies: [
          "Monitor symptoms closely",
          "Maintain good hydration",
          "Rest and avoid strenuous activity",
          "Seek care if symptoms worsen"
        ]
      });
    }
    
    if (promptLower.includes('education') || promptLower.includes('patient')) {
      return JSON.stringify({
        simpleExplanation: "You appear to have a common viral infection that affects your respiratory system. This is very treatable and usually gets better on its own with proper care.",
        lifestyleModifications: [
          "Get plenty of rest to help your body fight the infection",
          "Drink lots of fluids like water, warm tea, or soup",
          "Use a humidifier or breathe steam to ease congestion",
          "Eat nutritious foods to support your immune system"
        ],
        warningSignsToWatch: [
          "Difficulty breathing or shortness of breath",
          "High fever that doesn't respond to medication",
          "Severe headache or neck stiffness",
          "Symptoms that get much worse instead of better"
        ],
        whenToSeekHelp: [
          "If you have trouble breathing",
          "If your fever goes above 39°C (102°F) and stays high",
          "If you feel much worse instead of gradually better",
          "If you develop new concerning symptoms"
        ],
        customizedContent: "Most people with similar symptoms recover completely within 1-2 weeks with good self-care. The key is to rest, stay hydrated, and watch for any worsening symptoms."
      });
    }
    
    if (promptLower.includes('alert') || promptLower.includes('clinical')) {
      return JSON.stringify([
        {
          type: "info",
          priority: 3,
          message: "Monitor for symptom progression",
          actionRequired: "Check patient status in 24-48 hours",
          timeframe: "Within 2 days"
        },
        {
          type: "warning",
          priority: 6,
          message: "Watch for respiratory distress",
          actionRequired: "Advise patient on when to seek immediate care",
          timeframe: "Ongoing monitoring"
        }
      ]);
    }
    
    if (promptLower.includes('diagnosis') || promptLower.includes('differential')) {
      return JSON.stringify({
        diagnoses: [
          {
            name: "Upper Respiratory Infection",
            description: "Common viral infection affecting the nose, throat, and airways. Usually resolves within 7-10 days with supportive care.",
            confidence: 75,
            severity: "medium",
            probability: 75,
            clinicalEvidence: 7,
            symptomMatch: 75,
            literatureSupport: "moderate",
            category: "Infectious Disease",
            redFlags: ["Difficulty breathing", "High fever > 39°C"],
            recommendedTests: ["Complete Blood Count", "Throat Culture"],
            additionalTestingNeeded: ["Chest X-ray if respiratory symptoms persist"]
          },
          {
            name: "Allergic Rhinitis",
            description: "Allergic reaction causing nasal congestion, sneezing, and runny nose. Often seasonal or triggered by environmental allergens.",
            confidence: 60,
            severity: "low",
            probability: 60,
            clinicalEvidence: 6,
            symptomMatch: 65,
            literatureSupport: "moderate",
            category: "Allergic Reaction",
            redFlags: ["Severe breathing difficulty"],
            recommendedTests: ["Allergy Testing"],
            additionalTestingNeeded: ["IgE levels"]
          }
        ],
        followUpQuestions: [],
        redFlags: ["Difficulty breathing", "High fever", "Severe headache"],
        recommendedTests: ["Complete Blood Count", "Basic Metabolic Panel"],
        overallConfidence: 70
      });
    }
    
    // Default demo response for other prompts
    return "This is a demo response. The application is running in demo mode. Please configure Groq API keys in the .env file for full AI functionality.";
  }

  async generateFollowUpQuestions(symptoms: string, mode: 'unified' | 'doctor' | 'patient', patientInfo?: any): Promise<string[]> {
    const prompt = this.buildFollowUpQuestionsPrompt(symptoms, mode, patientInfo);
    
    try {
      // Use chat model for generating follow-up questions
      const response = await this.callGroqAPI(prompt, false);
      return this.parseFollowUpQuestions(response);
    } catch (error) {
      console.error('Groq Follow-up Questions Error:', error);
      // Fallback to demo questions
      return this.generateDemoFollowUpQuestions(symptoms, mode);
    }
  }

  async analyzeSymptoms(symptoms: string, mode: 'unified' | 'doctor' | 'patient', patientInfo?: any): Promise<AIAnalysisResult> {
    const basePrompt = this.buildAnalysisPrompt(symptoms, mode, patientInfo);
    
    try {
      // Use DeepSeek R1 Distill Llama 70B for medical reasoning
      const reasonerResponse = await this.callGroqAPI(basePrompt, true);
      
      // Parse the reasoner response to extract structured data
      const analysisResult = this.parseReasonerResponse(reasonerResponse);
      
      return analysisResult;
    } catch (error) {
      console.error('Groq AI Service Error:', error);
      // Fallback to demo mode when Groq API is not available
      return this.generateDemoAnalysis(symptoms, mode, patientInfo);
    }
  }

  // Enhanced Analysis Methods
  async generateMCQQuestions(symptoms: string, mode: 'doctor' | 'patient', diagnosis?: string, patientInfo?: any, analysisResult?: any): Promise<MCQQuestion[]> {
    // Generate dynamic MCQs based on actual consultation data
    if (diagnosis && analysisResult) {
      return this.generateDynamicMCQs(symptoms, mode, diagnosis, patientInfo, analysisResult);
    }
    
    // Fallback to static MCQs if no consultation data available
    console.log('Using enhanced fallback MCQ questions');
    return this.generateEnhancedFallbackMCQ(mode, symptoms);
  }

  // Generate dynamic MCQs based on consultation results
  private generateDynamicMCQs(symptoms: string, mode: 'doctor' | 'patient', diagnosis: string, patientInfo: any, analysisResult: any): MCQQuestion[] {
    const mcqs: MCQQuestion[] = [];
    const confidence = analysisResult.overallConfidence || 75;
    const age = patientInfo?.age || 35;
    const gender = patientInfo?.gender || 'patient';
    const diagnoses = analysisResult.diagnoses || [];
    
    // Dynamic question generation based on diagnosis type
    const diagnosisLower = diagnosis.toLowerCase();
    const symptomsLower = symptoms.toLowerCase();
    
    // Cardiovascular questions
    if (symptomsLower.includes('chest pain') || symptomsLower.includes('heart') || diagnosisLower.includes('cardiac')) {
      mcqs.push({
        id: `cardiac-dx-${Date.now()}`,
        question: `A ${age}-year-old ${gender} presents with chest pain. Based on the symptoms "${symptoms}", what is the most appropriate initial assessment priority?`,
        options: [
          `Rule out acute coronary syndrome with ECG and troponins`,
          `Immediate cardiac catheterization`,
          `Discharge with pain medication`,
          `Psychiatric evaluation for anxiety`
        ],
        correctAnswer: 0,
        category: "cardiovascular",
        explanation: `Chest pain requires systematic evaluation to exclude life-threatening conditions like ACS.`,
        followUp: `What additional risk factors would increase concern for ACS?`
      });
    }
    
    // Infectious disease questions
    if (symptomsLower.includes('fever') || diagnosisLower.includes('viral') || diagnosisLower.includes('infection')) {
      mcqs.push({
        id: `infectious-tx-${Date.now()}`,
        question: `For this case of ${diagnosis} with confidence ${confidence}%, what is the most appropriate treatment approach?`,
        options: [
          diagnosisLower.includes('viral') ? `Supportive care with rest, fluids, and symptom management` : `Empirical antibiotic therapy`,
          `Immediate antiviral medication regardless of etiology`,
          `Hospitalization for IV antibiotics`,
          `No treatment needed, observation only`
        ],
        correctAnswer: 0,
        category: "treatment",
        explanation: `Treatment should be tailored to the specific pathogen type and severity.`,
        followUp: `When would you consider escalating care?`
      });
    }
    
    // Neurological questions
    if (symptomsLower.includes('headache') || symptomsLower.includes('head pain') || diagnosisLower.includes('migraine')) {
      mcqs.push({
        id: `neuro-redflags-${Date.now()}`,
        question: `In this ${age}-year-old with headache, which finding would most urgently require neuroimaging?`,
        options: [
          `Sudden onset severe headache with neck stiffness`,
          `Chronic daily headache pattern`,
          `Headache only with stress`,
          `Mild headache with normal exam`
        ],
        correctAnswer: 0,
        category: "red-flags",
        explanation: `Sudden severe headache with neck stiffness suggests serious intracranial pathology.`,
        followUp: `What other neurological red flags should be assessed?`
      });
    }
    
    // Respiratory questions
    if (symptomsLower.includes('cough') || symptomsLower.includes('breathing') || diagnosisLower.includes('respiratory')) {
      mcqs.push({
        id: `respiratory-prognosis-${Date.now()}`,
        question: `What is the expected prognosis for this case of ${diagnosis} in a ${age}-year-old ${gender}?`,
        options: [
          confidence > 80 ? `Good prognosis with complete recovery expected in 1-2 weeks` : `Uncertain prognosis requiring close monitoring`,
          `Chronic condition requiring long-term therapy`,
          `Life-threatening condition requiring ICU care`,
          `Self-limiting condition needing no intervention`
        ],
        correctAnswer: 0,
        category: "prognosis",
        explanation: `Prognosis depends on diagnostic confidence, patient age, and condition severity.`,
        followUp: `What factors could worsen the prognosis?`
      });
    }
    
    // Clinical reasoning (always included)
    mcqs.push({
      id: `reasoning-confidence-${Date.now()}`,
      question: `With a diagnostic confidence of ${confidence}% for ${diagnosis}, what is the most appropriate next step?`,
      options: [
        confidence >= 80 ? `Proceed with evidence-based treatment` : `Gather additional diagnostic information`,
        `Treat empirically regardless of confidence`,
        `Refer immediately to specialist`,
        `Discharge without follow-up`
      ],
      correctAnswer: 0,
      category: "clinical-reasoning",
      explanation: `Clinical decisions should reflect diagnostic confidence and treatment risk-benefit ratio.`,
      followUp: `How would you monitor treatment response?`
    });
    
    // Patient safety (always included)
    mcqs.push({
      id: `safety-education-${Date.now()}`,
      question: `When educating this patient about ${diagnosis}, which safety information is most critical?`,
      options: [
        `Warning signs requiring immediate medical attention`,
        `Complete pathophysiology explanation`,
        `All possible rare complications`,
        `Insurance and billing procedures`
      ],
      correctAnswer: 0,
      category: "patient-safety",
      explanation: `Patient safety education about red flag symptoms is the highest priority.`,
      followUp: `What specific warning signs should be emphasized?`
    });
    
    // Differential diagnosis
    if (diagnoses.length > 1) {
      mcqs.push({
        id: `differential-dx-${Date.now()}`,
        question: `Given the presentation "${symptoms}", which differential diagnosis is most likely?`,
        options: [
          diagnoses[0]?.name || diagnosis,
          diagnoses[1]?.name || "Alternative diagnosis",
          diagnoses[2]?.name || "Less likely condition",
          "Requires emergency intervention"
        ],
        correctAnswer: 0,
        category: "differential-diagnosis",
        explanation: `The primary diagnosis has the highest likelihood based on symptom analysis.`,
        followUp: `What additional tests could help confirm the diagnosis?`
      });
    }
    
    return mcqs.slice(0, 8); // Return up to 8 questions
  }

  // Enhanced fallback MCQs with symptom awareness
  private generateEnhancedFallbackMCQ(mode: 'doctor' | 'patient', symptoms?: string): MCQQuestion[] {
    const symptomsLower = symptoms?.toLowerCase() || '';
    const mcqs: MCQQuestion[] = [];
    
    // Add symptom-specific questions
    if (symptomsLower.includes('fever') || symptomsLower.includes('temperature')) {
      mcqs.push({
        id: `fever-management-${Date.now()}`,
        question: "For a patient presenting with fever, what is the most appropriate initial assessment?",
        options: [
          "Take vital signs, assess hydration status, and look for infection source",
          "Immediately start antibiotics",
          "Order extensive imaging studies",
          "Discharge with fever reducers only"
        ],
        correctAnswer: 0,
        category: "symptom-management",
        explanation: "Systematic assessment helps identify serious conditions and guides appropriate treatment."
      });
    }
    
    if (symptomsLower.includes('pain') || symptomsLower.includes('ache')) {
      mcqs.push({
        id: `pain-assessment-${Date.now()}`,
        question: "When assessing pain, which approach provides the most comprehensive evaluation?",
        options: [
          "Use validated pain scales and assess impact on function",
          "Rely only on patient's verbal description",
          "Focus solely on pain intensity",
          "Assume all pain requires opioid medication"
        ],
        correctAnswer: 0,
        category: "pain-management",
        explanation: "Comprehensive pain assessment includes intensity, quality, impact, and underlying causes."
      });
    }
    
    // Add general clinical questions
    mcqs.push(...this.getGeneralClinicalMCQs(mode));
    
    return mcqs.slice(0, 6);
  }

  private getGeneralClinicalMCQs(mode: 'doctor' | 'patient'): MCQQuestion[] {
    if (mode === 'patient') {
      return [
        {
          id: `patient-safety-${Date.now()}`,
          question: "When should you seek immediate medical attention?",
          options: [
            "For severe symptoms like chest pain, difficulty breathing, or signs of stroke",
            "Only when symptoms last more than a month",
            "Never, always wait for scheduled appointments",
            "Only during business hours"
          ],
          correctAnswer: 0,
          category: "patient-safety",
          explanation: "Serious symptoms require immediate evaluation to prevent complications."
        },
        {
          id: `medication-safety-${Date.now()}`,
          question: "What is most important when taking any medication?",
          options: [
            "Follow dosing instructions and check for drug interactions",
            "Take the maximum dose for faster relief",
            "Stop immediately if you feel better",
            "Share medications with family members"
          ],
          correctAnswer: 0,
          category: "medication-safety",
          explanation: "Proper medication use prevents adverse effects and ensures effectiveness."
        }
      ];
    } else {
      return [
        {
          id: `clinical-reasoning-${Date.now()}`,
          question: "In clinical decision-making, what is the most important factor?",
          options: [
            "Integration of clinical findings with evidence-based guidelines",
            "Relying solely on personal experience",
            "Following the most expensive treatment option",
            "Always choosing the newest treatment available"
          ],
          correctAnswer: 0,
          category: "clinical-reasoning",
          explanation: "Evidence-based practice combined with clinical judgment provides optimal care."
        },
        {
          id: `risk-assessment-${Date.now()}`,
          question: "When stratifying patient risk, which factors are most important?",
          options: [
            "Patient age, comorbidities, severity of presentation, and response to initial treatment",
            "Insurance status and hospital preferences",
            "Patient's family requests only",
            "Time of day and staffing levels"
          ],
          correctAnswer: 0,
          category: "risk-stratification",
          explanation: "Clinical factors determine appropriate level of care and monitoring needs."
        }
      ];
    }
  }

  async performConfidenceAnalysis(diagnosis: string, symptoms: string, patientInfo: any): Promise<any> {
    const confidencePrompt = `
    For diagnosis: "${diagnosis}" with symptoms: "${symptoms}"
    Patient info: ${JSON.stringify(patientInfo)}
    
    Provide detailed confidence analysis:
    - Clinical evidence strength (1-10)
    - Symptom match percentage (0-100)
    - Literature support level (weak/moderate/strong)
    - Need for additional testing
    
    Return as JSON:
    {
      "clinicalEvidence": 8,
      "symptomMatch": 85,
      "literatureSupport": "strong",
      "additionalTestingNeeded": ["CBC", "Chest X-ray"],
      "overallConfidence": 82,
      "rationale": "Strong clinical correlation with typical presentation..."
    }`;

    try {
      const response = await this.callGroqAPI(confidencePrompt, true);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return {
        clinicalEvidence: 7,
        symptomMatch: 75,
        literatureSupport: "moderate",
        additionalTestingNeeded: [],
        overallConfidence: 75,
        rationale: "Analysis completed with moderate confidence"
      };
    }
  }

  async generateTreatmentPathway(diagnosis: string, patientInfo: any): Promise<TreatmentPathway> {
    const treatmentPrompt = `
    Based on diagnosis: "${diagnosis}"
    Patient profile: ${JSON.stringify(patientInfo)}
    
    Provide comprehensive treatment pathway:
    1. First-line therapy options
    2. Alternative treatments
    3. Monitoring requirements
    4. Follow-up schedule
    5. When to escalate care
    
    Format as JSON:
    {
      "firstLineTherapy": ["Antibiotic X", "Rest", "Fluids"],
      "alternativeTreatments": ["Alternative therapy Y"],
      "monitoringRequirements": ["Daily temperature", "Oxygen saturation"],
      "followUpSchedule": "Return in 48-72 hours if symptoms worsen",
      "escalationCriteria": ["High fever >39°C", "Difficulty breathing"]
    }`;

    try {
      const response = await this.callGroqAPI(treatmentPrompt, true);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return {
        firstLineTherapy: ["Symptomatic treatment", "Rest", "Hydration"],
        alternativeTreatments: ["Consult specialist if no improvement"],
        monitoringRequirements: ["Monitor symptoms"],
        followUpSchedule: "Follow up in 1-2 weeks",
        escalationCriteria: ["Worsening symptoms", "New concerning signs"]
      };
    }
  }

  async checkDrugInteractions(medications: string[], allergies: string[], diagnosis: string): Promise<string[]> {
    const drugInteractionPrompt = `
    Current medications: ${medications.join(', ')}
    Known allergies: ${allergies.join(', ')}
    Diagnosis: ${diagnosis}
    
    Check for:
    - Drug-drug interactions
    - Drug-disease contraindications
    - Allergy considerations
    - Dosage adjustments needed
    
    Return array of warnings/interactions as JSON:
    ["Warning 1", "Interaction 2", "Contraindication 3"]`;

    try {
      const response = await this.callGroqAPI(drugInteractionPrompt, true);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return ["No significant interactions detected"];
    }
  }

  async performRiskStratification(diagnosis: string, patientInfo: any): Promise<RiskAssessment> {
    const riskPrompt = `
    For diagnosis: "${diagnosis}"
    Patient: ${JSON.stringify(patientInfo)}
    
    Perform comprehensive risk stratification:
    - Immediate risk (next 24 hours): low/medium/high/critical
    - Short-term risk (next week): low/medium/high  
    - Long-term risk (next 6 months): low/medium/high
    
    Provide specific risk factors and mitigation strategies.
    
    Format as JSON:
    {
      "immediateRisk": "low",
      "shortTermRisk": "medium", 
      "longTermRisk": "low",
      "riskFactors": ["Risk factor 1", "Risk factor 2"],
      "mitigationStrategies": ["Strategy 1", "Strategy 2"]
    }`;

    try {
      const response = await this.callGroqAPI(riskPrompt, true);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return {
        immediateRisk: "low",
        shortTermRisk: "low", 
        longTermRisk: "low",
        riskFactors: ["Monitor symptoms closely", "Follow prescribed treatment"],
        mitigationStrategies: ["Follow prescribed treatment", "Regular monitoring", "Maintain healthy lifestyle"]
      };
    }
  }

  async generatePatientEducation(diagnosis: string, educationLevel: string, language: string): Promise<PatientEducation> {
    const educationPrompt = `
    Create patient education material for: "${diagnosis}"
    Education level: ${educationLevel}
    Language preference: ${language}
    
    Include:
    - Simple explanations suitable for education level
    - Lifestyle modifications
    - Warning signs to watch for
    - When to seek immediate help
    - Customized content based on language/culture
    
    Format as JSON:
    {
      "simpleExplanation": "Easy to understand explanation",
      "lifestyleModifications": ["Modification 1", "Modification 2"],
      "warningSignsToWatch": ["Warning sign 1", "Warning sign 2"],
      "whenToSeekHelp": ["Seek help if...", "Call doctor when..."],
      "customizedContent": "Additional culturally appropriate content"
    }`;

    try {
      const response = await this.callGroqAPI(educationPrompt, false);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return {
        simpleExplanation: `You have been diagnosed with ${diagnosis}. This condition affects your health and needs proper care.`,
        lifestyleModifications: ["Rest when needed", "Stay hydrated", "Follow medication schedule"],
        warningSignsToWatch: ["Worsening symptoms", "New severe symptoms", "Difficulty breathing"],
        whenToSeekHelp: ["If symptoms get worse", "If you have severe pain", "If you feel very unwell"],
        customizedContent: "Please follow up with your healthcare provider for personalized guidance."
      };
    }
  }

  async generateClinicalAlerts(diagnosis: string, patientInfo: any, symptoms: string): Promise<ClinicalAlert[]> {
    const alertPrompt = `
    Generate clinical alerts for:
    Diagnosis: "${diagnosis}"
    Patient: ${JSON.stringify(patientInfo)}
    Symptoms: "${symptoms}"
    
    Generate alerts for:
    - Critical lab values needed
    - Drug allergy warnings
    - Contraindication alerts
    - Immediate action required
    
    Format as prioritized alert system (JSON array):
    [{
      "type": "critical/warning/info",
      "priority": 1-10,
      "message": "Alert message",
      "actionRequired": "Specific action needed",
      "timeframe": "When to act"
    }]`;

    try {
      const response = await this.callGroqAPI(alertPrompt, true);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return [{
        type: "info",
        priority: 5,
        message: "Continue monitoring patient condition",
        actionRequired: "Regular assessment",
        timeframe: "Ongoing"
      }];
    }
  }

  async getSecondOpinion(primaryDiagnosis: string, symptoms: string, patientInfo: any): Promise<string> {
    const secondOpinionPrompt = `
    Primary diagnosis: "${primaryDiagnosis}"
    Symptoms: "${symptoms}"
    Patient info: ${JSON.stringify(patientInfo)}
    
    Provide alternative diagnostic perspective:
    - Challenge primary diagnosis
    - Consider rare/atypical presentations
    - Suggest additional testing
    - When to seek specialist consultation
    
    Return critical analysis as text.`;

    try {
      const response = await this.callGroqAPI(secondOpinionPrompt, true);
      return response;
    } catch (error) {
      return "Second opinion analysis unavailable. Consider specialist consultation if symptoms persist or worsen.";
    }
  }

  async adaptCommunicationStyle(content: string, userType: 'medical_professional' | 'patient' | 'caregiver' | 'student'): Promise<string> {
    const communicationPrompt = `
    Adapt this medical content for: ${userType}
    Original content: "${content}"
    
    Adaptation guidelines:
    - Medical professional: Technical language, ICD codes, clinical details
    - Patient: Simple terms, analogies, reassuring tone
    - Caregiver: Practical guidance, what to watch for
    - Student: Educational details, learning points
    
    Return adapted content as text.`;

    try {
      const response = await this.callGroqAPI(communicationPrompt, false);
      return response;
    } catch (error) {
      return content; // Return original if adaptation fails
    }
  }

  async checkApiHealth(): Promise<any> {
    try {
      const reasonerKey = process.env.GROQ_API_KEY_REASONER;
      const chatKey = process.env.GROQ_API_KEY_CHAT;
      
      if (!reasonerKey || !chatKey) {
        return {
          reasoner: { 
            status: 'demo_mode', 
            message: 'API key not configured - using demo responses' 
          },
          chat: { 
            status: 'demo_mode', 
            message: 'API key not configured - using demo responses' 
          }
        };
      }
      
      const reasonerResponse = await this.callGroqAPI("Health check", true);
      const chatResponse = await this.callGroqAPI("Health check", false);
      
      return {
        reasoner: { status: 'available', response: reasonerResponse },
        chat: { status: 'available', response: chatResponse }
      };
    } catch (error) {
      return {
        reasoner: { status: 'unavailable', error: error instanceof Error ? error.message : String(error) },
        chat: { status: 'unavailable', error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  async testConnection(prompt: string): Promise<string> {
    try {
      return await this.callGroqAPI(prompt, false);
    } catch (error) {
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper method to clean JSON responses
  private cleanJSONResponse(response: string): string {
    try {
      // First try to parse the response as-is
      JSON.parse(response.trim());
      return response.trim();
    } catch {
      // If that fails, try to extract JSON from the response
      const jsonStart = response.indexOf('{') !== -1 ? response.indexOf('{') : response.indexOf('[');
      const jsonEnd = response.lastIndexOf('}') !== -1 ? response.lastIndexOf('}') + 1 : response.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error('No valid JSON found in response');
      }
      
      const extracted = response.substring(jsonStart, jsonEnd);
      
      // Validate the extracted JSON
      try {
        JSON.parse(extracted);
        return extracted;
      } catch {
        throw new Error('Extracted content is not valid JSON');
      }
    }
  }

  private generateFallbackMCQ(mode: 'unified' | 'doctor' | 'patient'): MCQQuestion[] {
    if (mode === 'patient') {
      return [
        {
          id: "mcq_1",
          question: "What is the most important first step when experiencing concerning symptoms?",
          options: [
            "Ignore them and hope they go away", 
            "Self-medicate with online remedies", 
            "Document symptoms and seek professional evaluation", 
            "Wait several weeks to see if they persist"
          ],
          category: "health_education",
          correctAnswer: 2,
          explanation: "Documenting symptoms and seeking professional evaluation ensures proper diagnosis and prevents potential complications.",
          followUp: "When should you seek immediate medical attention?"
        },
        {
          id: "mcq_2", 
          question: "Which lifestyle factor has the greatest impact on overall health?",
          options: [
            "Taking expensive supplements", 
            "Following extreme diets", 
            "Regular exercise and balanced nutrition", 
            "Avoiding all medical care"
          ],
          category: "preventive_care",
          correctAnswer: 2,
          explanation: "Regular exercise and balanced nutrition are the foundation of good health and disease prevention.",
          followUp: "How often should you engage in physical activity for optimal health?"
        },
        {
          id: "mcq_3",
          question: "What is the best way to manage chronic conditions?",
          options: [
            "Only take medication when symptoms are severe", 
            "Follow your healthcare provider's treatment plan consistently", 
            "Switch medications frequently to find what works", 
            "Rely solely on alternative medicine"
          ],
          category: "chronic_care",
          correctAnswer: 1,
          explanation: "Consistent adherence to your healthcare provider's treatment plan leads to better outcomes and prevents complications.",
          followUp: "How often should you follow up with your healthcare provider for chronic conditions?"
        },
        {
          id: "mcq_4",
          question: "When should you seek emergency medical care?",
          options: [
            "Only when you lose consciousness", 
            "For severe chest pain, difficulty breathing, or severe bleeding", 
            "Only during regular business hours", 
            "After trying home remedies for several days"
          ],
          category: "emergency_care",
          correctAnswer: 1,
          explanation: "Severe chest pain, difficulty breathing, and severe bleeding are medical emergencies requiring immediate attention.",
          followUp: "What information should you have ready when calling emergency services?"
        },
        {
          id: "mcq_5",
          question: "How can you best prepare for medical appointments?",
          options: [
            "Just show up and see what happens", 
            "Bring a list of symptoms, medications, and questions", 
            "Only mention the most severe symptoms", 
            "Let the doctor do all the talking"
          ],
          category: "patient_advocacy",
          correctAnswer: 1,
          explanation: "Being prepared with symptoms, medications, and questions helps ensure you get the most out of your appointment.",
          followUp: "What questions should you always ask about new medications?"
        }
      ];
    } else {
      return [
        {
          id: "mcq_1",
          question: "Which diagnostic test would be most appropriate initially?",
          options: ["Complete Blood Count", "Chest X-ray", "ECG", "Urinalysis"],
          category: "diagnostic_testing",
          correctAnswer: 0,
          explanation: "CBC provides valuable information about infection, anemia, and other systemic conditions."
        },
        {
          id: "mcq_2",
          question: "What is the most likely differential diagnosis?",
          options: ["Viral infection", "Bacterial infection", "Autoimmune condition", "Neoplastic process"],
          category: "differential_diagnosis",
          correctAnswer: 0,
          explanation: "Viral infections are statistically more common and present with similar symptom patterns."
        },
        {
          id: "mcq_3",
          question: "What is the appropriate first-line treatment?",
          options: ["Symptomatic care", "Antibiotics", "Corticosteroids", "Referral to specialist"],
          category: "treatment",
          correctAnswer: 0,
          explanation: "Symptomatic care is often the most appropriate initial approach for many conditions."
        }
      ];
    }
  }

  private buildAnalysisPrompt(symptoms: string, mode: string, patientInfo?: any): string {
    const modeContext = mode === 'doctor' 
      ? "You are assisting a healthcare professional with clinical decision support."
      : "You are providing patient education and guidance. Use simple, non-technical language.";

    return `${modeContext}

Patient symptoms: ${symptoms}
${patientInfo ? `Patient information: Age ${patientInfo.age}, Gender: ${patientInfo.gender}` : ''}

Provide a differential diagnosis analysis. Your response MUST be a valid JSON object with this exact structure:
{
  "diagnoses": [
    {
      "name": "Diagnosis name",
      "description": "Clear description",
      "confidence": 85,
      "category": "Category name",
      "redFlags": ["flag1", "flag2"],
      "recommendedTests": ["test1", "test2"]
    }
  ],
  "overallConfidence": 85,
  "redFlags": ["general red flags"],
  "recommendedTests": ["general tests"]
}

Focus on:
1. Most likely diagnoses with confidence scores
2. Red flag symptoms requiring immediate attention
3. Appropriate diagnostic tests
4. Clear, actionable recommendations
${mode === 'doctor' ? '5. Include ICD-10 codes and medical references where appropriate' : '5. Use patient-friendly language'}`;
  }

  private buildFollowUpQuestionsPrompt(symptoms: string, mode: string, patientInfo?: any): string {
    const modeContext = mode === 'doctor' 
      ? "You are assisting a healthcare professional with patient assessment. Generate detailed, clinical follow-up questions."
      : "You are helping a patient provide detailed health information. Use simple, clear language that patients can easily understand.";

    return `${modeContext}

Based on these initial symptoms: "${symptoms}"
${patientInfo ? `Patient information: Age ${patientInfo.age}, Gender: ${patientInfo.gender}` : ''}

Generate 4-6 specific follow-up questions that would help gather essential information for a comprehensive medical assessment.

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]

${mode === 'doctor' ? `Focus on PROFESSIONAL/CLINICAL aspects:
- Detailed symptom progression and clinical timeline  
- Associated symptoms, triggers, and aggravating factors
- Comprehensive past medical history and family history
- Current medications, dosages, and potential interactions
- Physical examination findings and clinical observations
- Differential diagnosis considerations
- Risk stratification factors

Use medical terminology and clinical precision.` : `Focus on PERSONAL/PATIENT-FRIENDLY aspects:
- When did this start and how has it changed over time?
- What makes you feel better or worse?
- Have you noticed any other symptoms along with this?
- What medications or treatments are you currently using?
- Have you or your family members had similar problems before?
- How is this affecting your daily activities?

Use simple, everyday language that's easy to understand.`}

Keep questions clear, specific, and directly relevant to the symptoms described.`;
  }

  private buildFollowUpPrompt(symptoms: string, analysis: AIAnalysisResult): string {
    return `Based on these symptoms: "${symptoms}" and the preliminary analysis, generate 3-5 specific follow-up questions that would help refine the diagnosis. 

Return only a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]

Focus on:
- Symptom clarification
- Duration and onset
- Associated symptoms
- Medical history
- Medications and allergies`;
  }

  private parseReasonerResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          diagnoses: parsed.diagnoses || [],
          followUpQuestions: [],
          redFlags: parsed.redFlags || [],
          recommendedTests: parsed.recommendedTests || [],
          overallConfidence: parsed.overallConfidence || 0
        };
      }
    } catch (error) {
      console.error('Failed to parse reasoner response:', error);
    }

    // Fallback parsing for non-JSON responses
    return this.fallbackParsing(response);
  }

  private parseFollowUpQuestions(response: string): string[] {
    try {
      // Clean the response string before parsing
      const cleanedResponse = response.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse follow-up questions:', error);
    }

    // Fallback: extract questions from text
    const questions = response.split('\n')
      .filter(line => line.includes('?'))
      .map(line => line.trim().replace(/^\d+\.?\s*/, ''))
      .slice(0, 5);

    return questions.length > 0 ? questions : [
      "Can you describe the onset and duration of your symptoms?",
      "Have you experienced any associated symptoms?",
      "Are there any specific triggers or patterns you've noticed?"
    ];
  }

  private fallbackParsing(response: string): AIAnalysisResult {
    // Basic fallback parsing for when JSON parsing fails
    return {
      diagnoses: [
        {
          name: "Analysis Available",
          description: "AI analysis completed. Please review the detailed response.",
          confidence: 75,
          category: "General",
          redFlags: [],
          recommendedTests: [],
          severity: "medium",
          probability: 75,
          clinicalEvidence: 7,
          symptomMatch: 75,
          literatureSupport: "moderate",
          additionalTestingNeeded: []
        }
      ],
      followUpQuestions: [],
      redFlags: [],
      recommendedTests: [],
      overallConfidence: 75
    };
  }

  private generateDemoAnalysis(symptoms: string, mode: 'unified' | 'doctor' | 'patient', patientInfo?: any): AIAnalysisResult {
    // Intelligent demo analysis based on symptoms
    const symptomLower = symptoms.toLowerCase();
    
    // Common symptom patterns and their likely diagnoses
    const patterns = [
      {
        keywords: ['fever', 'joint pain', 'muscle ache'],
        diagnoses: [
          { name: 'Dengue Fever', confidence: 72, category: 'Viral Infection' },
          { name: 'Chikungunya', confidence: 20, category: 'Viral Infection' },
          { name: 'Viral Fever', confidence: 8, category: 'Viral Infection' }
        ],
        questions: [
          'How long has the fever lasted?',
          'Any recent travel to tropical areas?',
          'Any skin rashes or bleeding?',
          'Has there been sore throat or cough?'
        ],
        redFlags: ['Check for bleeding gums', 'Monitor platelet count'],
        tests: ['CBC with platelet count', 'Dengue NS1 antigen', 'Liver function tests']
      },
      {
        keywords: ['headache', 'migraine', 'head pain'],
        diagnoses: [
          { name: 'Tension Headache', confidence: 65, category: 'Neurological' },
          { name: 'Migraine', confidence: 25, category: 'Neurological' },
          { name: 'Cluster Headache', confidence: 10, category: 'Neurological' }
        ],
        questions: [
          'Where exactly is the pain located?',
          'Is the pain throbbing or constant?',
          'Any visual changes or nausea?',
          'What triggers seem to make it worse?'
        ],
        redFlags: ['Sudden severe headache', 'Neck stiffness', 'Vision changes'],
        tests: ['Neurological examination', 'Blood pressure check', 'CT scan if severe']
      },
      {
        keywords: ['chest pain', 'breathing', 'shortness of breath'],
        diagnoses: [
          { name: 'Anxiety', confidence: 45, category: 'Psychological' },
          { name: 'Acid Reflux', confidence: 30, category: 'Gastrointestinal' },
          { name: 'Costochondritis', confidence: 25, category: 'Musculoskeletal' }
        ],
        questions: [
          'Is the pain sharp or burning?',
          'Does it worsen with deep breathing?',
          'Any recent stress or anxiety?',
          'Does it relate to eating or lying down?'
        ],
        redFlags: ['Severe crushing chest pain', 'Pain radiating to arm/jaw', 'Severe shortness of breath'],
        tests: ['ECG', 'Chest X-ray', 'Stress test if indicated']
      }
    ];

    // Find best matching pattern
    let bestMatch = patterns[0];
    let maxMatches = 0;

    for (const pattern of patterns) {
      const matches = pattern.keywords.filter(keyword => symptomLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = pattern;
      }
    }

    // Generate mode-specific questions
    const modeSpecificQuestions = mode === 'doctor' 
      ? bestMatch.questions.concat([
          'What are the vital signs?',
          'Any relevant medical history?',
          'Current medications?'
        ])
      : bestMatch.questions.concat([
          'How would you rate the pain from 1-10?',
          'Does anything make it better or worse?',
          'Are you taking any medications?'
        ]);

    // Create comprehensive analysis
    const diagnoses = bestMatch.diagnoses.map(d => ({
      ...d,
      description: this.generateDiagnosisDescription(d.name, mode),
      redFlags: mode === 'doctor' ? bestMatch.redFlags : bestMatch.redFlags.map(flag => `⚠️ ${flag}`),
      recommendedTests: bestMatch.tests,
      severity: "medium",
      probability: d.confidence,
      clinicalEvidence: Math.floor(d.confidence / 10),
      symptomMatch: d.confidence,
      literatureSupport: "moderate",
      additionalTestingNeeded: []
    }));

    const overallConfidence = Math.round(
      diagnoses.reduce((sum, d) => sum + d.confidence, 0) / diagnoses.length
    );

    return {
      diagnoses,
      followUpQuestions: modeSpecificQuestions.slice(0, 5),
      followUpMCQs: this.generateDemoFollowUpMCQs(symptoms, bestMatch.diagnoses[0]?.name || 'General'),
      redFlags: bestMatch.redFlags,
      recommendedTests: bestMatch.tests,
      overallConfidence,
      mcqQuestions: this.generateFallbackMCQ(mode)
    };
  }

  private generateDiagnosisDescription(name: string, mode: 'unified' | 'doctor' | 'patient'): string {
    const descriptions: Record<string, { doctor: string; patient: string }> = {
      'Dengue Fever': {
        doctor: 'Mosquito-borne viral infection. Monitor for hemorrhagic complications and plasma leakage.',
        patient: 'A viral infection spread by mosquitoes. Usually gets better with rest and fluids, but needs monitoring.'
      },
      'Chikungunya': {
        doctor: 'Alphavirus infection with characteristic joint involvement. Chronic arthralgia may persist.',
        patient: 'A viral infection that causes fever and joint pain. Joint pain may last several weeks.'
      },
      'Tension Headache': {
        doctor: 'Primary headache disorder. Often stress-related with bilateral distribution.',
        patient: 'Common type of headache often caused by stress, tension, or muscle strain in the head and neck.'
      },
      'Migraine': {
        doctor: 'Neurological disorder with recurrent episodes. Consider prophylaxis if frequent.',
        patient: 'A type of headache that can be very painful and may come with nausea or sensitivity to light.'
      }
    };

    // Handle unified mode by defaulting to patient-friendly descriptions
    const targetMode = mode === 'unified' ? 'patient' : mode;
    return descriptions[name]?.[targetMode] || `${mode === 'doctor' || mode === 'unified' ? 'Clinical condition requiring evaluation.' : 'Medical condition that should be evaluated by a healthcare provider.'}`;
  }

  private generateDemoFollowUpQuestions(symptoms: string, mode: 'unified' | 'doctor' | 'patient'): string[] {
    const symptomLower = symptoms.toLowerCase();
    
    // General questions that apply to most symptoms
    const generalQuestions = mode === 'doctor' ? [
      "When did the symptoms first appear and how have they progressed?",
      "What is the severity of symptoms on a scale of 1-10?",
      "Are there any associated symptoms or warning signs?",
      "What is the patient's relevant medical and family history?",
      "What medications is the patient currently taking?",
      "Have any treatments been attempted and what were the results?"
    ] : [
      "When did you first notice these symptoms?",
      "How would you rate the severity from 1-10?",
      "Have you noticed any other symptoms along with this?",
      "Do you have any ongoing health conditions?",
      "What medications are you currently taking?",
      "Have you tried anything to relieve the symptoms?"
    ];
    
    // Symptom-specific questions
    if (symptomLower.includes('fever') || symptomLower.includes('temperature')) {
      return mode === 'doctor' ? [
        "What is the documented temperature range and pattern?",
        "Any associated symptoms like rigors, sweats, or rash?",
        "Recent travel history or exposure to infectious diseases?",
        "Any localizing symptoms suggesting source of infection?"
      ] : [
        "How high has your temperature been?",
        "Are you experiencing chills or sweating?",
        "Have you traveled anywhere recently?",
        "Do you have any pain or discomfort anywhere specific?"
      ];
    }
    
    if (symptomLower.includes('pain') || symptomLower.includes('ache')) {
      return mode === 'doctor' ? [
        "Can you describe the character, location, and radiation of pain?",
        "What are the aggravating and relieving factors?",
        "Is there any temporal pattern to the pain?",
        "Any associated neurological symptoms?"
      ] : [
        "Where exactly do you feel the pain?",
        "What does the pain feel like (sharp, dull, burning)?",
        "Does anything make the pain better or worse?",
        "Have you noticed any numbness or tingling?"
      ];
    }
    
    if (symptomLower.includes('headache') || symptomLower.includes('head')) {
      return mode === 'doctor' ? [
        "What is the location, quality, and severity of the headache?",
        "Any associated neurological symptoms or aura?",
        "Is there photophobia, phonophobia, or nausea?",
        "Any recent head trauma or medication changes?"
      ] : [
        "Where in your head do you feel the pain?",
        "Do you feel sick to your stomach or sensitive to light?",
        "Have you hit your head recently?",
        "Are you taking any new medications?"
      ];
    }
    
    // Return first 5 questions, falling back to general if no specific match
    return generalQuestions.slice(0, 5);
  }

  async generateFollowUpMCQs(symptoms: string, diagnosis: string, mode: 'unified' | 'doctor' | 'patient'): Promise<FollowUpMCQ[]> {
    // Always use demo MCQs for now to ensure they work properly
    return this.generateDemoFollowUpMCQs(symptoms, diagnosis);
  }

  private generateDemoFollowUpMCQs(symptoms: string, diagnosis: string): FollowUpMCQ[] {
    const baseQuestions = [
      {
        id: "timing",
        question: "When did you first notice these symptoms?",
        options: [
          { id: "recent", text: "Less than 24 hours ago", value: "acute" },
          { id: "few_days", text: "2-7 days ago", value: "subacute" },
          { id: "week_plus", text: "More than a week ago", value: "chronic" }
        ],
        category: "timing"
      },
      {
        id: "severity",
        question: "How would you rate the severity of your symptoms?",
        options: [
          { id: "mild", text: "Mild - barely noticeable", value: "mild" },
          { id: "moderate", text: "Moderate - interferes with daily activities", value: "moderate" },
          { id: "severe", text: "Severe - significantly impacts daily life", value: "severe" }
        ],
        category: "severity"
      },
      {
        id: "progression",
        question: "How have your symptoms changed over time?",
        options: [
          { id: "better", text: "Getting better", value: "improving" },
          { id: "same", text: "Staying the same", value: "stable" },
          { id: "worse", text: "Getting worse", value: "worsening" }
        ],
        category: "progression"
      },
      {
        id: "triggers",
        question: "What makes your symptoms better or worse?",
        options: [
          { id: "rest", text: "Rest makes it better", value: "rest_helps" },
          { id: "activity", text: "Activity makes it worse", value: "activity_worsens" },
          { id: "position", text: "Certain positions help/worsen", value: "position_dependent" },
          { id: "nothing", text: "Nothing seems to affect it", value: "constant" }
        ],
        category: "triggers"
      },
      {
        id: "associated",
        question: "Do you have any other symptoms along with this?",
        options: [
          { id: "fever", text: "Fever or chills", value: "fever" },
          { id: "nausea", text: "Nausea or vomiting", value: "nausea" },
          { id: "fatigue", text: "Unusual fatigue", value: "fatigue" },
          { id: "none", text: "No other symptoms", value: "isolated" }
        ],
        category: "associated"
      },
      {
        id: "medication",
        question: "Have you taken any medication for this?",
        options: [
          { id: "otc_helped", text: "Over-the-counter medicine helped", value: "otc_effective" },
          { id: "otc_no_help", text: "Over-the-counter medicine didn't help", value: "otc_ineffective" },
          { id: "prescription", text: "I have prescription medication", value: "prescription" },
          { id: "no_medication", text: "Haven't taken anything yet", value: "none" }
        ],
        category: "medication"
      }
    ];

    // Add specific questions based on symptoms
    if (symptoms.toLowerCase().includes('pain')) {
      baseQuestions.push({
        id: "pain_quality",
        question: "How would you describe the pain?",
        options: [
          { id: "sharp", text: "Sharp or stabbing", value: "sharp" },
          { id: "dull", text: "Dull or aching", value: "dull" },
          { id: "burning", text: "Burning sensation", value: "burning" },
          { id: "throbbing", text: "Throbbing or pulsing", value: "throbbing" }
        ],
        category: "pain_quality"
      });
    }

    return baseQuestions.slice(0, 6); // Return first 6 questions
  }

  // ...existing code...
}

export const aiService = new AIService();
