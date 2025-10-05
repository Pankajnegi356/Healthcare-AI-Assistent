import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, User, Bot, Server, BriefcaseMedical, Heart, Pill, Circle, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ConversationEntry } from "../types/medical";

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  models?: {
    reasoner?: string;
    chat?: string;
  };
  database?: string;
}

interface SidebarPanelProps {
  sessionId: string;
  sessionDuration: string;
  queriesUsed: number;
  overallConfidence: number;
  onExport: () => void;
}

export function SidebarPanel({ 
  sessionId, 
  sessionDuration, 
  queriesUsed, 
  overallConfidence, 
  onExport 
}: SidebarPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch conversation history
  const { data: conversationHistory = [] } = useQuery<ConversationEntry[]>({
    queryKey: ['/api/sessions', sessionId, 'conversation'],
    enabled: !!sessionId,
  });

  // Fetch health status
  const { data: healthData } = useQuery<HealthData>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const queryClient = useQueryClient();

  // AI Connection Test Mutation
  const testAIConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test-ai-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to test AI connectivity');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh health data to get updated status
      queryClient.invalidateQueries({ queryKey: ['/api/health'] });
      
      // Show success toast
      if (data.status === 'success') {
        toast({
          title: "AI Connection Test Successful",
          description: "All AI models are connected and working properly.",
        });
      } else {
        toast({
          title: "AI Connection Test Completed",
          description: data.message || "Some AI models may have connectivity issues.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('AI connection test failed:', error);
      toast({
        title: "AI Connection Test Failed",
        description: "Unable to test AI connectivity. Please check your network connection.",
        variant: "destructive"
      });
    },
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Session Status */}
      <Card className="consultation-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Session Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session Duration</span>
              <span className="text-sm font-medium">{sessionDuration}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Queries Used</span>
              <span className="text-sm font-medium">{queriesUsed}/50</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confidence Score</span>
              <span className={`text-sm font-medium ${getConfidenceColor(overallConfidence)}`}>
                {overallConfidence}%
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <Button 
                onClick={onExport} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Clinical Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {conversationHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No conversation history yet
                </p>
              ) : (
                conversationHistory.map((entry, index) => (
                  <div key={entry.id || index} className="text-sm">
                    <div className="flex items-start space-x-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        entry.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {entry.type === 'user' ? (
                          <User className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Bot className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 leading-relaxed break-words">
                          {entry.message.length > 100 
                            ? `${entry.message.substring(0, 100)}...` 
                            : entry.message
                          }
                        </p>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp 
                            ? formatTime(new Date(entry.timestamp))
                            : formatTime(currentTime)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Educational Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <BriefcaseMedical className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Understanding Migraines</h4>
                <p className="text-xs text-gray-600">Learn about migraine triggers and management</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <Heart className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">When to Seek Emergency Care</h4>
                <p className="text-xs text-gray-600">Red flag symptoms that require immediate attention</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <Pill className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Headache Management</h4>
                <p className="text-xs text-gray-600">Lifestyle and medication options</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">AI Model Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAIConnectionMutation.mutate()}
              disabled={testAIConnectionMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              {testAIConnectionMutation.isPending ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Test
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle className={`w-2 h-2 ${
                  healthData?.models?.reasoner === 'connected' ? 'text-green-500' : 
                  healthData?.models?.reasoner === 'demo_mode' ? 'text-yellow-500' : 'text-red-500'
                } fill-current`} />
                <span className="text-sm text-gray-700">DeepSeek Reasoner</span>
              </div>
              <Badge variant="secondary" className={
                healthData?.models?.reasoner === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : healthData?.models?.reasoner === 'demo_mode'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }>
                {healthData?.models?.reasoner === 'connected' ? 'Connected' : 
                 healthData?.models?.reasoner === 'demo_mode' ? 'Demo Mode' :
                 healthData?.models?.reasoner === 'disconnected' ? 'Disconnected' : 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle className={`w-2 h-2 ${
                  healthData?.models?.chat === 'connected' ? 'text-green-500' : 
                  healthData?.models?.chat === 'demo_mode' ? 'text-yellow-500' : 'text-red-500'
                } fill-current`} />
                <span className="text-sm text-gray-700">DeepSeek Chat</span>
              </div>
              <Badge variant="secondary" className={
                healthData?.models?.chat === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : healthData?.models?.chat === 'demo_mode'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }>
                {healthData?.models?.chat === 'connected' ? 'Connected' : 
                 healthData?.models?.chat === 'demo_mode' ? 'Demo Mode' :
                 healthData?.models?.chat === 'disconnected' ? 'Disconnected' : 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-3 h-3 text-blue-600" />
                <span className="text-sm text-gray-700">Database</span>
              </div>
              <Badge variant="secondary" className={
                healthData?.database === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }>
                {healthData?.database === 'connected' ? 'Connected' : 
                 healthData?.database === 'disconnected' ? 'Disconnected' : 'Unknown'}
              </Badge>
            </div>

            {/* Test Results Display */}
            {testAIConnectionMutation.data && (
              <div className="mt-3 p-2 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">Last Test: {testAIConnectionMutation.data.status}</div>
                  {testAIConnectionMutation.data.results && (
                    <div className="space-y-1">
                      <div>Reasoner: {testAIConnectionMutation.data.results.reasoner.status}</div>
                      <div>Chat: {testAIConnectionMutation.data.results.chat.status}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {testAIConnectionMutation.error && (
              <div className="mt-3 p-2 bg-red-50 rounded-md">
                <div className="text-xs text-red-600">
                  Test failed: {testAIConnectionMutation.error.message}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
