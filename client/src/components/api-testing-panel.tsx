import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  FileText
} from 'lucide-react';

interface APITestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export const APITestingPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: APITestResult }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  
  // Test form states
  const [sessionData, setSessionData] = useState({
    sessionId: `test-${Date.now()}`,
    mode: 'patient',
    patientInfo: { age: 30, gender: 'male' }
  });
  
  const [mcqTestData, setMcqTestData] = useState({
    symptoms: 'chest pain and shortness of breath',
    mode: 'patient',
    sessionId: '',
    questionType: 'mcq'
  });
  
  const [descriptiveTestData, setDescriptiveTestData] = useState({
    symptoms: 'headache and nausea',
    mode: 'patient', 
    sessionId: '',
    questionType: 'descriptive'
  });

  const executeTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(prev => ({ ...prev, [testName]: true }));
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          duration,
          timestamp: new Date()
        }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
          timestamp: new Date()
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testCreateSession = async () => {
    await executeTest('createSession', async () => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update session IDs for other tests
      setMcqTestData(prev => ({ ...prev, sessionId: data.sessionId }));
      setDescriptiveTestData(prev => ({ ...prev, sessionId: data.sessionId }));
      
      return data;
    });
  };

  const testMCQQuestions = async () => {
    await executeTest('mcqQuestions', async () => {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcqTestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.followUpMCQs && !data.questions) {
        throw new Error('No MCQ questions returned');
      }
      
      return data;
    });
  };

  const testDescriptiveQuestions = async () => {
    await executeTest('descriptiveQuestions', async () => {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(descriptiveTestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No descriptive questions returned');
      }
      
      return data;
    });
  };

  const testMCQAnalysis = async () => {
    await executeTest('mcqAnalysis', async () => {
      const mcqAnswers = [
        { question: 'When did the pain start?', answer: 'This morning' },
        { question: 'Rate pain severity (1-10)?', answer: '7' }
      ];
      
      const analysisData = {
        symptoms: mcqTestData.symptoms,
        mode: mcqTestData.mode,
        sessionId: mcqTestData.sessionId,
        followUpAnswers: mcqAnswers
      };
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.diagnoses || data.diagnoses.length === 0) {
        throw new Error('No diagnoses returned from MCQ analysis');
      }
      
      return data;
    });
  };

  const testDescriptiveAnalysis = async () => {
    await executeTest('descriptiveAnalysis', async () => {
      const descriptiveAnswers = [
        { 
          question: 'When did the headache start?', 
          answer: 'The headache started yesterday evening and has been getting progressively worse.' 
        },
        { 
          question: 'Describe the nausea symptoms?', 
          answer: 'I feel nauseous especially when I move my head quickly, and I vomited once this morning.' 
        }
      ];
      
      const analysisData = {
        symptoms: descriptiveTestData.symptoms,
        mode: descriptiveTestData.mode,
        sessionId: descriptiveTestData.sessionId,
        followUpAnswers: descriptiveAnswers
      };
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.diagnoses || data.diagnoses.length === 0) {
        throw new Error('No diagnoses returned from descriptive analysis');
      }
      
      return data;
    });
  };

  const runAllCoreTests = async () => {
    await testCreateSession();
    if (testResults.createSession?.success) {
      await Promise.all([
        testMCQQuestions(),
        testDescriptiveQuestions()
      ]);
      
      if (testResults.mcqQuestions?.success) {
        await testMCQAnalysis();
      }
      
      if (testResults.descriptiveQuestions?.success) {
        await testDescriptiveAnalysis();
      }
    }
  };

  const getStatusIcon = (testName: string) => {
    const result = testResults[testName];
    if (isLoading[testName]) return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
    if (!result) return <Clock className="w-4 h-4 text-gray-400" />;
    return result.success ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (testName: string) => {
    const result = testResults[testName];
    if (isLoading[testName]) return 'bg-blue-100 text-blue-800';
    if (!result) return 'bg-gray-100 text-gray-800';
    return result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Testing Panel</h2>
          <p className="text-gray-600">Test and validate core API functionality</p>
        </div>
        <Button onClick={runAllCoreTests} disabled={Object.values(isLoading).some(Boolean)}>
          {Object.values(isLoading).some(Boolean) ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running Tests
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="quick-tests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quick-tests">Quick Tests</TabsTrigger>
          <TabsTrigger value="detailed-config">Detailed Configuration</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-tests" className="space-y-4">
          <div className="grid gap-4">
            {/* Session Management Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon('createSession')}
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Test session creation and management</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor('createSession')}>
                      {isLoading.createSession ? 'TESTING' : 
                       testResults.createSession?.success ? 'PASS' : 
                       testResults.createSession ? 'FAIL' : 'PENDING'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={testCreateSession}
                      disabled={isLoading.createSession}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
                {testResults.createSession?.error && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{testResults.createSession.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* MCQ Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon('mcqQuestions')}
                  MCQ Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Test MCQ question generation</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('mcqQuestions')}>
                        {isLoading.mcqQuestions ? 'TESTING' : 
                         testResults.mcqQuestions?.success ? 'PASS' : 
                         testResults.mcqQuestions ? 'FAIL' : 'PENDING'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={testMCQQuestions}
                        disabled={isLoading.mcqQuestions || !mcqTestData.sessionId}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-gray-600">Test MCQ analysis processing</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('mcqAnalysis')}>
                        {isLoading.mcqAnalysis ? 'TESTING' : 
                         testResults.mcqAnalysis?.success ? 'PASS' : 
                         testResults.mcqAnalysis ? 'FAIL' : 'PENDING'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={testMCQAnalysis}
                        disabled={isLoading.mcqAnalysis || !mcqTestData.sessionId}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
                {(testResults.mcqQuestions?.error || testResults.mcqAnalysis?.error) && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {testResults.mcqQuestions?.error || testResults.mcqAnalysis?.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Descriptive Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon('descriptiveQuestions')}
                  Descriptive Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Test descriptive question generation</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('descriptiveQuestions')}>
                        {isLoading.descriptiveQuestions ? 'TESTING' : 
                         testResults.descriptiveQuestions?.success ? 'PASS' : 
                         testResults.descriptiveQuestions ? 'FAIL' : 'PENDING'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={testDescriptiveQuestions}
                        disabled={isLoading.descriptiveQuestions || !descriptiveTestData.sessionId}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-gray-600">Test descriptive analysis processing</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('descriptiveAnalysis')}>
                        {isLoading.descriptiveAnalysis ? 'TESTING' : 
                         testResults.descriptiveAnalysis?.success ? 'PASS' : 
                         testResults.descriptiveAnalysis ? 'FAIL' : 'PENDING'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={testDescriptiveAnalysis}
                        disabled={isLoading.descriptiveAnalysis || !descriptiveTestData.sessionId}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
                {(testResults.descriptiveQuestions?.error || testResults.descriptiveAnalysis?.error) && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {testResults.descriptiveQuestions?.error || testResults.descriptiveAnalysis?.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed-config" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Session ID</label>
                  <Input 
                    value={sessionData.sessionId}
                    onChange={(e) => setSessionData(prev => ({ ...prev, sessionId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mode</label>
                  <Select 
                    value={sessionData.mode} 
                    onValueChange={(value) => setSessionData(prev => ({ ...prev, mode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MCQ Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Symptoms</label>
                  <Textarea 
                    value={mcqTestData.symptoms}
                    onChange={(e) => setMcqTestData(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Enter symptoms for MCQ testing..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mode</label>
                  <Select 
                    value={mcqTestData.mode} 
                    onValueChange={(value) => setMcqTestData(prev => ({ ...prev, mode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <Card key={testName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                    {testName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.success ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Duration:</span>
                      <span>{result.duration}ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Timestamp:</span>
                      <span>{result.timestamp.toLocaleString()}</span>
                    </div>
                    
                    {result.error && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {result.data && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600">
                          View Response Data
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-96">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {Object.keys(testResults).length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results</h3>
                  <p className="text-gray-600">Run some tests to see results here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APITestingPanel;
