import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai-service";
import { insertConsultationSessionSchema, insertConversationEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new consultation session
  app.post("/api/sessions", async (req, res) => {
    try {
      console.log('[POST /api/sessions] Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      if (!req.body.sessionId || !req.body.mode) {
        console.log('[POST /api/sessions] Missing required fields:', { sessionId: req.body.sessionId, mode: req.body.mode });
        return res.status(400).json({ 
          error: "Missing required fields: sessionId and mode are required",
          received: req.body 
        });
      }

      const sessionData = insertConsultationSessionSchema.parse(req.body);
      console.log('[POST /api/sessions] Validated session data:', sessionData);
      
      const session = await storage.createSession(sessionData);
      console.log('[POST /api/sessions] Created session:', session);
      
      res.json(session);
    } catch (error) {
      console.error('[POST /api/sessions] Error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid session data", 
          details: error.errors,
          received: req.body
        });
      }
      
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Get session by ID
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve session" });
    }
  });

  // Update session
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.sessionId, updates);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Generate follow-up questions based on initial symptoms
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { symptoms, mode, sessionId, patientInfo, questionType } = req.body;
      
      // Debug logging
      console.log('Generate questions request body:', {
        symptoms: symptoms ? `[${symptoms.length} chars]` : 'undefined',
        mode,
        sessionId,
        patientInfo: patientInfo ? 'provided' : 'undefined',
        questionType
      });
      
      if (!symptoms || !mode || !sessionId) {
        console.log('Missing required fields:', { 
          hasSymptoms: !!symptoms, 
          hasMode: !!mode, 
          hasSessionId: !!sessionId 
        });
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Add user message to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'user',
        message: symptoms
      });

      // Generate follow-up content based on user's question preference
      let questions: string[] = [];
      let followUpMCQs: any[] = [];
      
      if (questionType === 'mcq') {
        // Generate MCQ questions
        try {
          followUpMCQs = await aiService.generateFollowUpMCQs(symptoms, 'initial_assessment', mode);
          questions = []; // No text questions for MCQ mode
        } catch (error) {
          console.error('Error generating follow-up MCQs:', error);
          // Fallback to text questions if MCQ generation fails
          questions = await aiService.generateFollowUpQuestions(symptoms, mode, patientInfo);
        }
      } else {
        // Generate descriptive text questions
        questions = await aiService.generateFollowUpQuestions(symptoms, mode, patientInfo);
      }

      // Update session with initial symptoms
      await storage.updateSession(sessionId, {
        symptoms,
        patientInfo: patientInfo || undefined
      });

      // Add AI response to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Generated follow-up questions to gather more details'
      });

      res.json({ 
        questions,
        followUpMCQs: followUpMCQs.length > 0 ? followUpMCQs : undefined 
      });
    } catch (error) {
      console.error('Question generation error:', error);
      res.status(500).json({ error: "Failed to generate follow-up questions. Please check AI service connectivity." });
    }
  });

  // Analyze symptoms with additional information from follow-up questions
  app.post("/api/analyze", async (req, res) => {
    try {
      const { symptoms, mode, sessionId, patientInfo, followUpAnswers } = req.body;
      
      if (!symptoms || !mode || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Combine initial symptoms with follow-up answers for comprehensive analysis
      const comprehensiveSymptoms = followUpAnswers 
        ? `${symptoms}\n\nAdditional Information:\n${followUpAnswers.map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}`
        : symptoms;

      // Add follow-up information to conversation if provided
      if (followUpAnswers && followUpAnswers.length > 0) {
        await storage.addConversationEntry({
          sessionId,
          type: 'user',
          message: `Follow-up responses: ${followUpAnswers.map((qa: any) => `${qa.question}: ${qa.answer}`).join('; ')}`
        });
      }

      // Perform comprehensive AI analysis
      const analysis = await aiService.analyzeSymptoms(comprehensiveSymptoms, mode, patientInfo);

      // Update session with analysis
      await storage.updateSession(sessionId, {
        symptoms: comprehensiveSymptoms,
        aiAnalysis: analysis
      });

      // Add AI response to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Provided comprehensive differential diagnoses and recommendations'
      });

      // Store individual diagnoses
      for (const diagnosis of analysis.diagnoses) {
        await storage.createDiagnosis({
          sessionId,
          name: diagnosis.name,
          description: diagnosis.description,
          confidence: diagnosis.confidence,
          category: diagnosis.category,
          redFlags: diagnosis.redFlags,
          recommendedTests: diagnosis.recommendedTests
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze symptoms. Please check AI service connectivity." });
    }
  });

  // Enhanced Analysis with MCQ and additional features
  app.post("/api/enhanced-analysis", async (req, res) => {
    try {
      const { symptoms, mode, sessionId, patientInfo, followUpAnswers } = req.body;
      
      if (!symptoms || !mode || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Combine initial symptoms with follow-up answers for comprehensive analysis
      const comprehensiveSymptoms = followUpAnswers 
        ? `${symptoms}\n\nAdditional Information:\n${followUpAnswers.map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}`
        : symptoms;

      // Perform basic analysis
      const analysis = await aiService.analyzeSymptoms(comprehensiveSymptoms, mode, patientInfo);
      
      let enhancedResult: any = { analysis };

      // Get primary diagnosis for enhanced features
      const primaryDiagnosis = analysis.diagnoses[0]?.name || comprehensiveSymptoms;

      try {
        // Generate follow-up MCQs for all users
        try {
          const followUpMCQs = await aiService.generateFollowUpMCQs(comprehensiveSymptoms, primaryDiagnosis, mode);
          enhancedResult.followUpMCQs = followUpMCQs;
        } catch (error) {
          console.error('Error generating follow-up MCQs:', error);
          // Continue without follow-up MCQs
        }

        // Generate MCQ questions for patients
        if (mode === 'patient') {
          try {
            const mcqQuestions = await aiService.generateMCQQuestions(comprehensiveSymptoms, mode, primaryDiagnosis);
            enhancedResult.mcqQuestions = mcqQuestions;
          } catch (error) {
            console.error('MCQ generation error:', error);
            // Continue without MCQ questions
          }

          const patientEducation = await aiService.generatePatientEducation(
            primaryDiagnosis, 
            patientInfo?.educationLevel || 'general',
            patientInfo?.language || 'english'
          );
          enhancedResult.patientEducation = patientEducation;
        }

        // Enhanced features for doctors
        if (mode === 'doctor') {
          const [treatmentPathway, riskAssessment, clinicalAlerts] = await Promise.all([
            aiService.generateTreatmentPathway(primaryDiagnosis, patientInfo),
            aiService.performRiskStratification(primaryDiagnosis, patientInfo),
            aiService.generateClinicalAlerts(primaryDiagnosis, patientInfo, comprehensiveSymptoms)
          ]);

          enhancedResult.treatmentPathway = treatmentPathway;
          enhancedResult.riskAssessment = riskAssessment;
          enhancedResult.clinicalAlerts = clinicalAlerts;
        }
      } catch (enhancedError) {
        console.error('Enhanced features error (non-blocking):', enhancedError);
        // Continue with basic analysis even if enhanced features fail
      }

      // Update session with enhanced analysis
      await storage.updateSession(sessionId, {
        symptoms: comprehensiveSymptoms,
        aiAnalysis: analysis
      });

      // Store individual diagnoses
      for (const diagnosis of analysis.diagnoses) {
        await storage.createDiagnosis({
          sessionId,
          name: diagnosis.name,
          description: diagnosis.description,
          confidence: diagnosis.confidence,
          category: diagnosis.category,
          redFlags: diagnosis.redFlags,
          recommendedTests: diagnosis.recommendedTests
        });
      }

      res.json(enhancedResult);
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      res.status(500).json({ error: "Failed to perform enhanced analysis. Please check AI service connectivity." });
    }
  });

  // Generate MCQ Questions
  app.post("/api/generate-mcq", async (req, res) => {
    try {
      const { diagnosis, patientInfo, mode } = req.body;
      
      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis is required" });
      }

      const questions = await aiService.generateMCQQuestions(diagnosis, patientInfo);
      res.json({ questions });
    } catch (error) {
      console.error('MCQ generation error:', error);
      res.status(500).json({ error: "Failed to generate MCQ questions" });
    }
  });

  // Get Treatment Pathway
  app.post("/api/treatment-pathway", async (req, res) => {
    try {
      const { diagnosis, patientInfo } = req.body;
      
      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis is required" });
      }

      const pathway = await aiService.generateTreatmentPathway(diagnosis, patientInfo);
      res.json(pathway);
    } catch (error) {
      console.error('Treatment pathway error:', error);
      res.status(500).json({ error: "Failed to generate treatment pathway" });
    }
  });

  // Get Risk Assessment
  app.post("/api/risk-assessment", async (req, res) => {
    try {
      const { diagnosis, symptoms, patientInfo } = req.body;
      
      if (!diagnosis || !symptoms) {
        return res.status(400).json({ error: "Diagnosis and symptoms are required" });
      }

      const assessment = await aiService.performRiskStratification(diagnosis, patientInfo);
      res.json(assessment);
    } catch (error) {
      console.error('Risk assessment error:', error);
      res.status(500).json({ error: "Failed to perform risk assessment" });
    }
  });

  // Get Patient Education
  app.post("/api/patient-education", async (req, res) => {
    try {
      const { diagnosis, educationLevel, language } = req.body;
      
      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis is required" });
      }

      const education = await aiService.generatePatientEducation(
        diagnosis, 
        educationLevel || 'general',
        language || 'english'
      );
      res.json(education);
    } catch (error) {
      console.error('Patient education error:', error);
      res.status(500).json({ error: "Failed to generate patient education" });
    }
  });

  // Get Clinical Alerts
  app.post("/api/clinical-alerts", async (req, res) => {
    try {
      const { diagnosis, symptoms, patientInfo } = req.body;
      
      if (!diagnosis || !symptoms) {
        return res.status(400).json({ error: "Diagnosis and symptoms are required" });
      }

      const alerts = await aiService.generateClinicalAlerts(diagnosis, patientInfo, symptoms);
      res.json(alerts);
    } catch (error) {
      console.error('Clinical alerts error:', error);
      res.status(500).json({ error: "Failed to generate clinical alerts" });
    }
  });

  // Get conversation history
  app.get("/api/sessions/:sessionId/conversation", async (req, res) => {
    try {
      console.log('[GET /api/sessions/:sessionId/conversation] SessionId:', req.params.sessionId);
      
      const history = await storage.getConversationHistory(req.params.sessionId);
      console.log('[GET /api/sessions/:sessionId/conversation] Found history entries:', history.length);
      
      res.json(history);
    } catch (error) {
      console.error('[GET /api/sessions/:sessionId/conversation] Error:', error);
      res.status(500).json({ 
        error: "Failed to retrieve conversation history",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get diagnoses for session
  app.get("/api/sessions/:sessionId/diagnoses", async (req, res) => {
    try {
      const diagnoses = await storage.getDiagnosesBySession(req.params.sessionId);
      res.json(diagnoses);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve diagnoses" });
    }
  });

  // Export session data
  app.get("/api/sessions/:sessionId/export", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const diagnoses = await storage.getDiagnosesBySession(req.params.sessionId);
      const conversation = await storage.getConversationHistory(req.params.sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const exportData = {
        session,
        diagnoses,
        conversation,
        exportedAt: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="consultation-${session.sessionId}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export session data" });
    }
  });

  // Generate patient education content
  app.post("/api/education", async (req, res) => {
    try {
      const { diagnosis } = req.body;
      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis required" });
      }

      const content = await aiService.generatePatientEducation(diagnosis, 'general', 'english');
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate educational content" });
    }
  });

  // Simple connectivity test
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      message: "Healthcare AI Server is running",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      cors: "enabled",
      remote_access: "configured"
    });
  });

  // Detailed health check for AI models and system status
  app.get("/api/health/detailed", async (req, res) => {
    try {
      // Test actual Groq API connectivity
      const modelStatus = await aiService.checkApiHealth();
      
      // Determine proper status based on API keys
      const reasonerKey = process.env.GROQ_API_KEY_REASONER;
      const chatKey = process.env.GROQ_API_KEY_CHAT;
      
      const reasonerStatus = reasonerKey ? (modelStatus.reasoner.status === 'available' ? 'connected' : 'disconnected') : 'demo_mode';
      const chatStatus = chatKey ? (modelStatus.chat.status === 'available' ? 'connected' : 'disconnected') : 'demo_mode';
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        models: {
          reasoner: reasonerStatus,
          chat: chatStatus
        },
        database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
        providers: {
          groq: {
            reasoner: "DeepSeek R1 Distill Llama 70B",
            chat: "Llama 3.3 70B Versatile"
          }
        },
        api_keys_configured: {
          reasoner: !!reasonerKey,
          chat: !!chatKey
        }
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        models: {
          reasoner: "disconnected",
          chat: "disconnected"
        },
        database: "disconnected"
      });
    }
  });

  // AI Test endpoint - for testing AI connectivity
  app.get("/api/test-ai", async (req, res) => {
    try {
      const prompt = req.query.prompt as string || "Hello, please respond with 'AI service is working'";
      console.log('[GET /api/test-ai] Testing AI with prompt:', prompt);
      
      const response = await aiService.testConnection(prompt);
      console.log('[GET /api/test-ai] AI response:', response);
      
      res.json({ 
        status: "success", 
        prompt, 
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[GET /api/test-ai] Error:', error);
      res.status(500).json({ 
        status: "error", 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Submit follow-up answers and proceed to analysis
  app.post("/api/submit-answers", async (req, res) => {
    try {
      const { sessionId, answers } = req.body;
      
      if (!sessionId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Missing required fields: sessionId and answers array" });
      }

      console.log(`[POST /api/submit-answers] SessionId: ${sessionId}, Answers: ${answers.length}`);

      // Store answers in conversation history
      for (const answer of answers) {
        await storage.addConversationEntry({
          sessionId,
          type: 'user',
          message: `Answer to ${answer.question || 'Follow-up question'}: ${answer.answer}`
        });
      }

      // Get session to retrieve symptoms and patient info
      const session = await storage.getSession(sessionId);

      if (!session) {
        console.log(`[POST /api/submit-answers] Session not found: ${sessionId}`);
        return res.status(404).json({ error: "Session not found" });
      }

      const symptoms = session.symptoms;

      if (!symptoms) {
        console.log(`[POST /api/submit-answers] No symptoms found for session: ${sessionId}`);
        return res.status(400).json({ error: "No symptoms found for this session" });
      }

      console.log(`[POST /api/submit-answers] Found symptoms: ${symptoms.substring(0, 50)}...`);

      // Generate final analysis with follow-up answers
      const followUpAnswers = answers.map((a: any) => ({
        question: a.question || `Question ${a.questionId}`,
        answer: a.answer
      }));

      console.log(`[POST /api/submit-answers] Calling AI analysis...`);
      const analysis = await aiService.analyzeSymptoms(
        symptoms,
        'unified',
        session.patientInfo
      );

      console.log(`[POST /api/submit-answers] Analysis completed successfully`);

      // Store analysis in session
      await storage.updateSession(sessionId, {
        aiAnalysis: JSON.stringify(analysis),
        updatedAt: new Date()
      });

      // Add analysis to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Generated comprehensive analysis based on symptoms and follow-up answers'
      });

      res.json({
        success: true,
        analysis,
        message: "Follow-up answers submitted and analysis generated successfully"
      });

    } catch (error) {
      console.error('[POST /api/submit-answers] Error:', error);
      res.status(500).json({ error: "Failed to submit answers and generate analysis", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // AI Connection Test endpoint - for testing and reconnecting AI services
  app.post("/api/test-ai-connection", async (req, res) => {
    try {
      console.log('[POST /api/test-ai-connection] Testing AI connectivity...');
      
      const results = {
        reasoner: { status: 'disconnected' as 'disconnected' | 'connected', error: null as string | null, model: 'deepseek-r1-distill-llama-70b' },
        chat: { status: 'disconnected' as 'disconnected' | 'connected', error: null as string | null, model: 'llama-3.3-70b-versatile' }
      };

      // Test reasoner connection
      try {
        const reasonerResponse = await aiService.testConnection("Test reasoner connection");
        results.reasoner.status = 'connected';
        console.log('[POST /api/test-ai-connection] Reasoner test successful:', reasonerResponse.substring(0, 50) + '...');
      } catch (error) {
        results.reasoner.error = error instanceof Error ? error.message : String(error);
        console.error('[POST /api/test-ai-connection] Reasoner test failed:', results.reasoner.error);
      }

      // Test chat connection (using a different prompt)
      try {
        const chatResponse = await aiService.testConnection("Test chat connection");
        results.chat.status = 'connected';
        console.log('[POST /api/test-ai-connection] Chat test successful:', chatResponse.substring(0, 50) + '...');
      } catch (error) {
        results.chat.error = error instanceof Error ? error.message : String(error);
        console.error('[POST /api/test-ai-connection] Chat test failed:', results.chat.error);
      }

      const allConnected = results.reasoner.status === 'connected' && results.chat.status === 'connected';
      
      res.json({ 
        status: allConnected ? "success" : "partial_failure",
        message: allConnected ? "All AI models connected successfully" : "Some AI models failed to connect",
        results,
        timestamp: new Date().toISOString(),
        api_keys_configured: {
          reasoner: !!process.env.GROQ_API_KEY_REASONER,
          chat: !!process.env.GROQ_API_KEY_CHAT
        }
      });
    } catch (error) {
      console.error('[POST /api/test-ai-connection] Unexpected error:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to test AI connectivity",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
