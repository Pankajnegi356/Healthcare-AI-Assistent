import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MCQDiagnosticTool from "./mcq-diagnostic-tool";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Clock,
  Users,
  FileText,
  Brain,
  Stethoscope,
  Thermometer,
  Zap,
  Eye,
  Ear,
  Wind,
  HeartHandshake,
  Settings,
  Bug
} from "lucide-react";

interface MedicalStats {
  totalConsultations: number;
  criticalCases: number;
  avgResponseTime: number;
  accuracyRate: number;
  patientsToday: number;
  urgentAlerts: number;
}

interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
}

interface MedicalDashboardProps {
  stats: MedicalStats;
  vitals?: VitalSigns;
  onEmergencyAlert?: () => void;
}

export function MedicalDashboard({ stats, vitals, onEmergencyAlert }: MedicalDashboardProps) {
  const [realTimeData, setRealTimeData] = useState<MedicalStats>(stats);
  const [isLoading, setIsLoading] = useState(false);
  const [alertLevel, setAlertLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        totalConsultations: prev.totalConsultations + Math.floor(Math.random() * 3),
        patientsToday: prev.patientsToday + Math.floor(Math.random() * 2),
        avgResponseTime: Math.max(1, prev.avgResponseTime + (Math.random() - 0.5) * 0.5),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate alert level based on stats
  const calculatedAlertLevel = useMemo(() => {
    if (realTimeData.criticalCases > 10) return 'critical';
    if (realTimeData.urgentAlerts > 5) return 'high';
    if (realTimeData.avgResponseTime > 3) return 'medium';
    return 'low';
  }, [realTimeData]);

  useEffect(() => {
    setAlertLevel(calculatedAlertLevel);
  }, [calculatedAlertLevel]);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-minimal';
    }
  };

  const formatVitals = (vitals?: VitalSigns) => {
    if (!vitals) return null;
    
    return [
      { icon: Heart, label: 'Heart Rate', value: `${vitals.heartRate} BPM`, status: vitals.heartRate > 100 ? 'high' : vitals.heartRate < 60 ? 'low' : 'normal' },
      { icon: Activity, label: 'Blood Pressure', value: vitals.bloodPressure, status: 'normal' },
      { icon: Thermometer, label: 'Temperature', value: `${vitals.temperature}°F`, status: vitals.temperature > 99.5 ? 'high' : 'normal' },
      { icon: Wind, label: 'O2 Saturation', value: `${vitals.oxygenSaturation}%`, status: vitals.oxygenSaturation < 95 ? 'low' : 'normal' },
      { icon: Activity, label: 'Respiratory Rate', value: `${vitals.respiratoryRate}/min`, status: 'normal' },
    ];
  };

  return (
    <div className="medical-dashboard space-y-6 p-6">
      {/* Emergency Alert Banner */}
      {alertLevel === 'critical' && (
        <div className="notification-error flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Critical Alert</h3>
              <p className="text-sm opacity-90">Multiple critical cases require immediate attention</p>
            </div>
          </div>
          <Button 
            onClick={onEmergencyAlert}
            className="btn-medical-danger"
          >
            Respond
          </Button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="medical-grid">
        <Card className="medical-card-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 medical-heading-3">
              <Users className="h-6 w-6 text-medical-blue" />
              Total Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-blue mb-2">
              {realTimeData.totalConsultations.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-medical-green" />
              <span className="text-sm text-medical-green">+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 medical-heading-3">
              <AlertTriangle className="h-6 w-6 text-medical-orange" />
              Critical Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-orange mb-2">
              {realTimeData.criticalCases}
            </div>
            <Badge className={`${getAlertColor(alertLevel)} float-medical`}>
              {alertLevel.toUpperCase()} PRIORITY
            </Badge>
          </CardContent>
        </Card>

        <Card className="medical-card-success">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 medical-heading-3">
              <Clock className="h-6 w-6 text-medical-teal" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-teal mb-2">
              {realTimeData.avgResponseTime.toFixed(1)}m
            </div>
            <Progress 
              value={Math.max(0, 100 - (realTimeData.avgResponseTime * 20))} 
              className="h-2 bg-medical-teal-light"
            />
          </CardContent>
        </Card>

        <Card className="medical-card-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 medical-heading-3">
              <Shield className="h-6 w-6 text-medical-purple" />
              Accuracy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-purple mb-2">
              {realTimeData.accuracyRate}%
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-medical-green" />
              <span className="text-sm text-medical-green">AI Enhanced</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-medical">
          <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
          <TabsTrigger value="vitals" className="text-white">Vitals</TabsTrigger>
          <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="text-white">Alerts</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-white">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="consultation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-medical-red" />
                  Patients Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-medical-red">
                  {realTimeData.patientsToday}
                </div>
              </CardContent>
            </Card>

            <Card className="consultation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-medical-blue" />
                  AI Diagnoses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-medical-blue">
                  {Math.floor(realTimeData.totalConsultations * 0.85)}
                </div>
              </CardContent>
            </Card>

            <Card className="consultation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-medical-green" />
                  Reports Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-medical-green">
                  {Math.floor(realTimeData.totalConsultations * 0.92)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          {vitals && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formatVitals(vitals)?.map((vital, index) => (
                <Card key={index} className="medical-card-success">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <vital.icon className="h-5 w-5" />
                      {vital.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{vital.value}</div>
                    <Badge 
                      className={
                        vital.status === 'high' ? 'severity-high' :
                        vital.status === 'low' ? 'severity-medium' :
                        'severity-low'
                      }
                    >
                      {vital.status.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="medical-card-primary">
            <CardHeader>
              <CardTitle className="medical-heading-2">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="medical-body">Diagnostic Accuracy</span>
                  <span className="font-semibold">{realTimeData.accuracyRate}%</span>
                </div>
                <Progress value={realTimeData.accuracyRate} className="h-3" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="medical-body">Patient Satisfaction</span>
                  <span className="font-semibold">94%</span>
                </div>
                <Progress value={94} className="h-3 bg-gradient-success" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="medical-body">System Efficiency</span>
                  <span className="font-semibold">89%</span>
                </div>
                <Progress value={89} className="h-3 bg-gradient-info" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            <div className="notification-warning">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold">High Priority Alert</h4>
                  <p className="text-sm opacity-90">Patient in room 204 requires immediate attention</p>
                </div>
              </div>
            </div>
            
            <div className="notification-info">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold">System Update</h4>
                  <p className="text-sm opacity-90">AI diagnostic model updated with latest medical research</p>
                </div>
              </div>
            </div>
            
            <div className="notification-success">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold">Security Check Complete</h4>
                  <p className="text-sm opacity-90">All patient data encryption verified</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <MCQDiagnosticTool />
        </TabsContent>
      </Tabs>
    </div>
  );
}
