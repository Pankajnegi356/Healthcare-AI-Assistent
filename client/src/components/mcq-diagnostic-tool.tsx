import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bug,
  FileText,
  MessageSquare,
  Activity,
  TestTube,
  Database,
  Zap
} from 'lucide-react';

interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: string;
  timestamp: Date;
}

interface APIHealthCheck {
  endpoint: string;
  status: 'online' | 'offline' | 'error';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

export const MCQDiagnosticTool: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [apiHealth, setAPIHealth] = useState<APIHealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testSymptoms, setTestSymptoms] = useState('chest pain and shortness of breath');
  const [testMode, setTestMode] = useState<'patient' | 'parent' | 'caregiver'>('patient');
  const [liveTestResults, setLiveTestResults] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  // Check network connectivity
  useEffect(() => {
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);
    
    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
    };
  }, []);

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    setAPIHealth([]);
    
    const newDiagnostics: DiagnosticResult[] = [];
    const newAPIHealth: APIHealthCheck[] = [];
    
    try {
      // 1. Check API Endpoints Health
      const endpoints = [
        '/api/sessions',
        '/api/generate-questions', 
        '/api/analyze',
        '/api/generate-mcq'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const responseTime = Date.now() - startTime;
          
          newAPIHealth.push({
            endpoint,
            status: response.ok ? 'online' : 'error',
            responseTime,
            lastChecked: new Date(),
            error: response.ok ? undefined : `HTTP ${response.status}`
          });
          
          newDiagnostics.push({
            component: `API Endpoint ${endpoint}`,
            status: response.ok ? 'healthy' : 'error',
            message: response.ok ? 'Endpoint responding' : `HTTP ${response.status} error`,
            details: `Response time: ${responseTime}ms`,
            timestamp: new Date()
          });
        } catch (error) {
          newAPIHealth.push({
            endpoint,
            status: 'offline',
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          newDiagnostics.push({
            component: `API Endpoint ${endpoint}`,
            status: 'error',
            message: 'Endpoint unreachable',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          });
        }
      }

      // 2. Test Session Creation
      try {
        const sessionResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: `diagnostic-test-${Date.now()}`,
            mode: testMode,
            patientInfo: { age: 30, gender: 'test' }
          })
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          newDiagnostics.push({
            component: 'Session Management',
            status: 'healthy',
            message: 'Session creation working',
            details: `Session ID: ${sessionData.sessionId}`,
            timestamp: new Date()
          });
        } else {
          const errorText = await sessionResponse.text();
          newDiagnostics.push({
            component: 'Session Management',
            status: 'error',
            message: 'Session creation failed',
            details: errorText,
            timestamp: new Date()
          });
        }
      } catch (error) {
        newDiagnostics.push({
          component: 'Session Management',
          status: 'error',
          message: 'Session creation error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }

      // 3. Test MCQ Question Generation
      try {
        const mcqResponse = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: testSymptoms,
            mode: testMode,
            sessionId: `diagnostic-test-${Date.now()}`,
            questionType: 'mcq'
          })
        });
        
        if (mcqResponse.ok) {
          const mcqData = await mcqResponse.json();
          const hasMCQs = mcqData.followUpMCQs && Array.isArray(mcqData.followUpMCQs) && mcqData.followUpMCQs.length > 0;
          
          newDiagnostics.push({
            component: 'MCQ Generation',
            status: hasMCQs ? 'healthy' : 'warning',
            message: hasMCQs ? 'MCQ generation working' : 'MCQ generation not returning data',
            details: `MCQs returned: ${mcqData.followUpMCQs?.length || 0}`,
            timestamp: new Date()
          });
        } else {
          const errorText = await mcqResponse.text();
          newDiagnostics.push({
            component: 'MCQ Generation',
            status: 'error',
            message: 'MCQ generation failed',
            details: errorText,
            timestamp: new Date()
          });
        }
      } catch (error) {
        newDiagnostics.push({
          component: 'MCQ Generation',
          status: 'error',
          message: 'MCQ generation error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }

      // 4. Test Descriptive Question Generation
      try {
        const descriptiveResponse = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: testSymptoms,
            mode: testMode,
            sessionId: `diagnostic-test-${Date.now()}`,
            questionType: 'descriptive'
          })
        });
        
        if (descriptiveResponse.ok) {
          const descriptiveData = await descriptiveResponse.json();
          const hasQuestions = descriptiveData.questions && Array.isArray(descriptiveData.questions) && descriptiveData.questions.length > 0;
          
          newDiagnostics.push({
            component: 'Descriptive Generation',
            status: hasQuestions ? 'healthy' : 'warning',
            message: hasQuestions ? 'Descriptive generation working' : 'Descriptive generation not returning data',
            details: `Questions returned: ${descriptiveData.questions?.length || 0}`,
            timestamp: new Date()
          });
        } else {
          const errorText = await descriptiveResponse.text();
          newDiagnostics.push({
            component: 'Descriptive Generation',
            status: 'error',
            message: 'Descriptive generation failed',
            details: errorText,
            timestamp: new Date()
          });
        }
      } catch (error) {
        newDiagnostics.push({
          component: 'Descriptive Generation',
          status: 'error',
          message: 'Descriptive generation error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }

      // 5. Check Environment Variables (if accessible)
      newDiagnostics.push({
        component: 'Environment Check',
        status: 'healthy',
        message: 'Frontend environment OK',
        details: `Network: ${networkStatus}, User Agent: ${navigator.userAgent.split(' ')[0]}`,
        timestamp: new Date()
      });

      // 6. Check Local Storage
      try {
        localStorage.setItem('diagnostic-test', 'test');
        localStorage.removeItem('diagnostic-test');
        newDiagnostics.push({
          component: 'Local Storage',
          status: 'healthy',
          message: 'Local storage accessible',
          timestamp: new Date()
        });
      } catch (error) {
        newDiagnostics.push({
          component: 'Local Storage',
          status: 'warning',
          message: 'Local storage issues detected',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }

    } catch (globalError) {
      newDiagnostics.push({
        component: 'Diagnostic System',
        status: 'error',
        message: 'Diagnostic system error',
        details: globalError instanceof Error ? globalError.message : 'Unknown error',
        timestamp: new Date()
      });
    }
    
    setDiagnostics(newDiagnostics);
    setAPIHealth(newAPIHealth);
    setIsRunning(false);
  };

  const runLiveTest = async () => {
    setLiveTestResults(null);
    
    try {
      // Create a session first
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `live-test-${Date.now()}`,
          mode: testMode,
          patientInfo: { age: 30, gender: 'test' }
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error(`Session creation failed: ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      
      // Test both MCQ and descriptive
      const [mcqResponse, descriptiveResponse] = await Promise.all([
        fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: testSymptoms,
            mode: testMode,
            sessionId: sessionData.sessionId,
            questionType: 'mcq'
          })
        }),
        fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: testSymptoms,
            mode: testMode,
            sessionId: sessionData.sessionId,
            questionType: 'descriptive'
          })
        })
      ]);
      
      const mcqData = mcqResponse.ok ? await mcqResponse.json() : { error: await mcqResponse.text() };
      const descriptiveData = descriptiveResponse.ok ? await descriptiveResponse.json() : { error: await descriptiveResponse.text() };
      
      setLiveTestResults({
        session: sessionData,
        mcq: {
          success: mcqResponse.ok,
          data: mcqData,
          status: mcqResponse.status
        },
        descriptive: {
          success: descriptiveResponse.ok,
          data: descriptiveData,
          status: descriptiveResponse.status
        }
      });
      
    } catch (error) {
      setLiveTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'online': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': case 'offline': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'online': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MCQ/Descriptive Diagnostic Tool</h2>
            <p className="text-gray-600">Comprehensive testing and diagnostics for question handling</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(networkStatus)}>
            Network: {networkStatus.toUpperCase()}
          </Badge>
          <Button onClick={runComprehensiveDiagnostics} disabled={isRunning}>
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Run Full Diagnostics
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="diagnostics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
          <TabsTrigger value="live-test">Live Testing</TabsTrigger>
          <TabsTrigger value="api-health">API Health</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          {diagnostics.length > 0 ? (
            <div className="space-y-3">
              {diagnostics.map((diagnostic, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(diagnostic.status)}
                        <div>
                          <h4 className="font-medium">{diagnostic.component}</h4>
                          <p className="text-sm text-gray-600">{diagnostic.message}</p>
                          {diagnostic.details && (
                            <p className="text-xs text-gray-500 mt-1">{diagnostic.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(diagnostic.status)}>
                          {diagnostic.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {diagnostic.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Diagnostics Run</h3>
                <p className="text-gray-600">Click "Run Full Diagnostics" to check system health.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Symptoms</label>
                <Textarea 
                  value={testSymptoms}
                  onChange={(e) => setTestSymptoms(e.target.value)}
                  placeholder="Enter symptoms to test..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">User Mode</label>
                <Select value={testMode} onValueChange={(value: any) => setTestMode(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="caregiver">Caregiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={runLiveTest} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Run Live Test
              </Button>
            </CardContent>
          </Card>

          {liveTestResults && (
            <Card>
              <CardHeader>
                <CardTitle>Live Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {liveTestResults.error ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{liveTestResults.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Session Creation</h4>
                      <Badge className="bg-green-100 text-green-800">SUCCESS</Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Session ID: {liveTestResults.session?.sessionId}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">MCQ Generation</h4>
                      <Badge className={liveTestResults.mcq.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {liveTestResults.mcq.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600">View MCQ Data</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                          {JSON.stringify(liveTestResults.mcq.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Descriptive Generation</h4>
                      <Badge className={liveTestResults.descriptive.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {liveTestResults.descriptive.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600">View Descriptive Data</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                          {JSON.stringify(liveTestResults.descriptive.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api-health" className="space-y-4">
          {apiHealth.length > 0 ? (
            <div className="space-y-3">
              {apiHealth.map((api, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(api.status)}
                        <div>
                          <h4 className="font-medium">{api.endpoint}</h4>
                          {api.responseTime && (
                            <p className="text-sm text-gray-600">Response time: {api.responseTime}ms</p>
                          )}
                          {api.error && (
                            <p className="text-sm text-red-600">Error: {api.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(api.status)}>
                          {api.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {api.lastChecked.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No API Health Data</h3>
                <p className="text-gray-600">Run diagnostics to check API endpoint health.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Common MCQ Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>No MCQ questions returned:</strong> Check if AI service has valid API keys</li>
                  <li>• <strong>MCQ format errors:</strong> Verify question structure matches expected format</li>
                  <li>• <strong>Timeout errors:</strong> AI service may be slow or unavailable</li>
                  <li>• <strong>Validation failures:</strong> Check input symptoms and user mode validity</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Common Descriptive Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Empty questions array:</strong> AI service may not be generating content</li>
                  <li>• <strong>Poor question quality:</strong> Check symptom input quality and detail</li>
                  <li>• <strong>Mode-specific failures:</strong> Some modes may have different question generation logic</li>
                  <li>• <strong>Session issues:</strong> Ensure valid session ID is being passed</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Application
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => localStorage.clear()}>
                    <Database className="w-4 h-4 mr-2" />
                    Clear Local Storage
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => console.clear()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Clear Console Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MCQDiagnosticTool;
