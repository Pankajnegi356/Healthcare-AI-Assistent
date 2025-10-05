import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Heart,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Camera,
  Mic,
  Monitor,
  Download,
  Share2,
  Settings,
  Bell,
  Eye,
  BarChart3,
  FileText,
  Database,
  Wifi,
  WifiOff,
  Server,
  Cpu,
  HardDrive,
  MemoryStick
} from 'lucide-react';
import { useMedicalNotifications } from './notification-system';

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  uptime: string;
  activeConnections: number;
}

interface RealTimeFeature {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  icon: React.ComponentType<any>;
  description: string;
  metrics?: {
    usage: number;
    performance: number;
    accuracy?: number;
  };
}

export function EnhancedFeaturesPanel() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    network: 78,
    storage: 34,
    uptime: '2d 14h 32m',
    activeConnections: 127
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [realTimeData, setRealTimeData] = useState<any>({});
  const notifications = useMedicalNotifications();
  const wsRef = useRef<WebSocket | null>(null);

  const [features] = useState<RealTimeFeature[]>([
    {
      id: 'ai-diagnostics',
      name: 'AI Diagnostics Engine',
      status: 'active',
      icon: Brain,
      description: 'Advanced machine learning for medical diagnosis',
      metrics: { usage: 87, performance: 94, accuracy: 96 }
    },
    {
      id: 'real-time-monitoring',
      name: 'Real-time Patient Monitoring',
      status: 'active',
      icon: Activity,
      description: 'Continuous vital signs and health monitoring',
      metrics: { usage: 92, performance: 89 }
    },
    {
      id: 'emergency-alerts',
      name: 'Emergency Alert System',
      status: 'active',
      icon: AlertTriangle,
      description: 'Instant notifications for critical situations',
      metrics: { usage: 23, performance: 98 }
    },
    {
      id: 'telemedicine',
      name: 'Telemedicine Platform',
      status: 'active',
      icon: Camera,
      description: 'Video consultations and remote care',
      metrics: { usage: 67, performance: 91 }
    },
    {
      id: 'voice-analysis',
      name: 'Voice Pattern Analysis',
      status: 'inactive',
      icon: Mic,
      description: 'AI-powered voice health assessment',
      metrics: { usage: 0, performance: 0 }
    },
    {
      id: 'predictive-analytics',
      name: 'Predictive Health Analytics',
      status: 'active',
      icon: TrendingUp,
      description: 'Forecasting health trends and risks',
      metrics: { usage: 78, performance: 93, accuracy: 89 }
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(30, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        activeConnections: Math.max(50, prev.activeConnections + Math.floor((Math.random() - 0.5) * 20))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notifications.success('Connection Restored', 'System is back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      notifications.warning('Connection Lost', 'Working in offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notifications]);

  // WebSocket connection for real-time data
  useEffect(() => {
    if (!monitoringEnabled) return;

    // Simulate WebSocket connection
    const connectWebSocket = () => {
      // In a real implementation, you would connect to your WebSocket server
      
      // Simulate connection
      setTimeout(() => {
        notifications.info('Real-time Monitoring', 'Connected to live data stream');
      }, 1000);
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [monitoringEnabled, notifications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'severity-low';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'severity-critical';
      default:
        return 'bg-gray-500';
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 70) return 'text-yellow-500';
    if (value >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    if (enabled) {
      notifications.success('Feature Enabled', `${features.find(f => f.id === featureId)?.name} is now active`);
    } else {
      notifications.info('Feature Disabled', `${features.find(f => f.id === featureId)?.name} has been deactivated`);
    }
  };

  const handleSystemOptimization = () => {
    notifications.info('System Optimization', 'Running performance optimization...');
    
    // Simulate optimization
    setTimeout(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpu: Math.max(20, prev.cpu - 15),
        memory: Math.max(30, prev.memory - 10)
      }));
      notifications.success('Optimization Complete', 'System performance improved');
    }, 3000);
  };

  const handleExportReport = () => {
    notifications.info('Generating Report', 'Creating comprehensive system report...');
    
    setTimeout(() => {
      const reportData = {
        timestamp: new Date().toISOString(),
        systemMetrics,
        features: features.map(f => ({
          name: f.name,
          status: f.status,
          metrics: f.metrics
        }))
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthcare-system-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      notifications.success('Report Generated', 'System report downloaded successfully');
    }, 2000);
  };

  return (
    <div className="enhanced-features-panel space-y-6 p-6">
      {/* Connection Status Bar */}
      <div className={`p-4 rounded-lg flex items-center justify-between ${
        isOnline ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 
        'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
          <span className={`font-medium ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {isOnline ? 'System Online' : 'Offline Mode'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto Refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={handleSystemOptimization}>
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* System Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="medical-card-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getMetricColor(100 - systemMetrics.cpu)}`}>
                  {systemMetrics.cpu.toFixed(0)}%
                </span>
                <Badge className={systemMetrics.cpu > 80 ? 'severity-high' : 'severity-low'}>
                  {systemMetrics.cpu > 80 ? 'HIGH' : 'NORMAL'}
                </Badge>
              </div>
              <Progress value={systemMetrics.cpu} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card-success">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MemoryStick className="h-4 w-4" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getMetricColor(100 - systemMetrics.memory)}`}>
                  {systemMetrics.memory.toFixed(0)}%
                </span>
                <Badge className={systemMetrics.memory > 85 ? 'severity-high' : 'severity-low'}>
                  {systemMetrics.memory > 85 ? 'HIGH' : 'NORMAL'}
                </Badge>
              </div>
              <Progress value={systemMetrics.memory} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getMetricColor(systemMetrics.network)}`}>
                  {systemMetrics.network.toFixed(0)}%
                </span>
                <Badge className="severity-low">ACTIVE</Badge>
              </div>
              <Progress value={systemMetrics.network} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="consultation-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {systemMetrics.activeConnections}
              </div>
              <div className="text-xs text-muted-foreground">
                Uptime: {systemMetrics.uptime}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Features Tabs */}
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-medical">
          <TabsTrigger value="features" className="text-white">Features</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-white">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.id} className="consultation-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-5 w-5" />
                      {feature.name}
                    </div>
                    <Badge className={getStatusColor(feature.status)}>
                      {feature.status.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  
                  {feature.metrics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Usage: {feature.metrics.usage}%</span>
                        <span>Performance: {feature.metrics.performance}%</span>
                      </div>
                      <Progress value={feature.metrics.usage} className="h-1" />
                      
                      {feature.metrics.accuracy && (
                        <div className="text-xs text-center">
                          <span className="text-green-600">Accuracy: {feature.metrics.accuracy}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Feature</span>
                    <Switch 
                      checked={feature.status === 'active'} 
                      onCheckedChange={(enabled) => handleFeatureToggle(feature.id, enabled)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card className="medical-card-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Real-time Monitoring Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Live Data Stream</span>
                <Switch checked={monitoringEnabled} onCheckedChange={setMonitoringEnabled} />
              </div>
              
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Real-time monitoring is {monitoringEnabled ? 'active' : 'inactive'}. 
                  {monitoringEnabled ? ' Receiving live data from connected devices.' : ' Enable to start monitoring.'}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Heart Rate Monitors</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">24 Active</div>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Vital Sign Sensors</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">18 Online</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="medical-card-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overall System Health</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">AI Diagnostic Accuracy</span>
                    <span className="font-semibold text-blue-600">96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">User Satisfaction</span>
                    <span className="font-semibold text-purple-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">+23%</div>
                  <div className="text-sm text-muted-foreground">Consultations this week</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+18%</div>
                  <div className="text-sm text-muted-foreground">AI diagnoses accuracy</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">-12%</div>
                  <div className="text-sm text-muted-foreground">Average response time</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="consultation-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Auto-optimization</span>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Real-time alerts</span>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Performance monitoring</span>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Data encryption</span>
                  <Switch defaultChecked disabled />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={handleExportReport} className="w-full btn-medical-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Export System Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
