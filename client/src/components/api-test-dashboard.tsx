import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  BarChart3,
  FileText,
  Download,
  Settings,
  Zap,
  Target
} from 'lucide-react';
import { apiTestService, type TestSuite, type TestResult } from '../services/api-test-service';

interface APITestDashboardProps {
  onClose?: () => void;
}

export const APITestDashboard: React.FC<APITestDashboardProps> = ({ onClose }) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestProgress(0);
    setCurrentTest('Initializing tests...');
    
    try {
      const results = await apiTestService.runAllTests();
      setTestSuites(results);
      setLastRunTime(new Date());
      setTestProgress(100);
      setCurrentTest('Tests completed');
    } catch (error) {
      console.error('Test execution failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'fail': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(testSuites, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `api-test-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
  const totalDuration = testSuites.reduce((sum, suite) => sum + suite.duration, 0);
  const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">API Testing Dashboard</h1>
                <p className="text-gray-600">Comprehensive API testing and validation suite</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportResults}
                disabled={testSuites.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
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
          </div>

          {/* Test Progress */}
          {isRunning && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Test Execution Progress</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Running
                    </Badge>
                  </div>
                  <Progress value={testProgress} className="w-full" />
                  <p className="text-sm text-gray-600">{currentTest}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          {testSuites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Tests</p>
                      <p className="text-3xl font-bold text-green-900">{totalTests}</p>
                    </div>
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Passed</p>
                      <p className="text-3xl font-bold text-blue-900">{totalPassed}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Failed</p>
                      <p className="text-3xl font-bold text-red-900">{totalFailed}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Success Rate</p>
                      <p className="text-3xl font-bold text-purple-900">{successRate}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Test Results */}
        {testSuites.length > 0 ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed Results</TabsTrigger>
              <TabsTrigger value="issues">Issues & Errors</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6">
                {testSuites.map((suite, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(suite.overallStatus)}
                          <div>
                            <CardTitle className="text-lg">{suite.name}</CardTitle>
                            <p className="text-sm text-gray-600">{suite.description}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(suite.overallStatus)}>
                          {suite.overallStatus.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{suite.totalTests}</p>
                          <p className="text-sm text-gray-600">Total Tests</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{suite.passedTests}</p>
                          <p className="text-sm text-gray-600">Passed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{suite.failedTests}</p>
                          <p className="text-sm text-gray-600">Failed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{suite.duration}ms</p>
                          <p className="text-sm text-gray-600">Duration</p>
                        </div>
                      </div>
                      <Progress 
                        value={suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0} 
                        className="mt-4"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="space-y-6">
                {testSuites.map((suite, suiteIndex) => (
                  <Card key={suiteIndex}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(suite.overallStatus)}
                        {suite.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {suite.tests.map((test, testIndex) => (
                          <div key={testIndex} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(test.status)}
                                <div>
                                  <h4 className="font-medium">{test.testName}</h4>
                                  <p className="text-sm text-gray-600">{test.endpoint}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(test.status)}>
                                  {test.status.toUpperCase()}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">{test.duration}ms</p>
                              </div>
                            </div>
                            
                            {test.details && (
                              <p className="text-sm text-gray-700 mb-2">{test.details}</p>
                            )}
                            
                            {test.error && (
                              <Alert className="mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Error:</strong> {test.error}
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {test.response && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                                  View Response Data
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(test.response, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-6">
              <div className="space-y-4">
                {testSuites.flatMap(suite => 
                  suite.tests.filter(test => test.status === 'fail' || test.status === 'error')
                ).map((test, index) => (
                  <Alert key={index} className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-red-800">{test.testName}</strong>
                          <Badge variant="destructive">{test.status.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-red-700">Endpoint: {test.endpoint}</p>
                        {test.error && (
                          <p className="text-sm text-red-800"><strong>Error:</strong> {test.error}</p>
                        )}
                        <p className="text-xs text-red-600">Duration: {test.duration}ms</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                
                {testSuites.flatMap(suite => 
                  suite.tests.filter(test => test.status === 'fail' || test.status === 'error')
                ).length === 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-green-800 mb-2">No Issues Found!</h3>
                      <p className="text-green-700">All tests are passing successfully.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalDuration}ms</p>
                        <p className="text-sm text-gray-600">Total Duration</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {totalTests > 0 ? Math.round(totalDuration / totalTests) : 0}ms
                        </p>
                        <p className="text-sm text-gray-600">Average per Test</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.max(...testSuites.flatMap(s => s.tests.map(t => t.duration)))}ms
                        </p>
                        <p className="text-sm text-gray-600">Slowest Test</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {testSuites.map((suite, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{suite.name} - Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {suite.tests
                          .sort((a, b) => b.duration - a.duration)
                          .map((test, testIndex) => (
                            <div key={testIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(test.status)}
                                <span className="font-medium">{test.testName}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min((test.duration / Math.max(...suite.tests.map(t => t.duration))) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-mono text-gray-600 w-16 text-right">
                                  {test.duration}ms
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="text-center p-12">
            <CardContent>
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Test APIs</h3>
              <p className="text-gray-600 mb-6">
                Click "Run All Tests" to start comprehensive API testing and validation.
              </p>
              <Button onClick={runAllTests} disabled={isRunning} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Testing
              </Button>
            </CardContent>
          </Card>
        )}

        {lastRunTime && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Last run: {lastRunTime.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default APITestDashboard;
