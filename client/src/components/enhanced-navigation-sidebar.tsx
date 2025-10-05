import React, { useState } from 'react';
import { 
  Brain, 
  Stethoscope, 
  Activity, 
  Shield, 
  BookOpen, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Heart,
  Pill,
  UserCheck,
  BarChart3,
  FileText,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Eye,
  Clock,
  Menu,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface EnhancedNavigationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onFeatureSelect: (feature: string) => void;
  activeFeature?: string;
  consultationCount?: number;
  isConsultationMode?: boolean;
  userType?: 'patient' | 'parent' | 'caregiver' | 'healthcare_professional';
  accessibilityLevel?: 'basic' | 'enhanced' | 'full';
}

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category?: 'analysis' | 'clinical' | 'education' | 'tools' | 'accessibility';
  badge?: string;
  isNew?: boolean;
  isPro?: boolean;
  userTypes?: ('patient' | 'parent' | 'caregiver' | 'healthcare_professional')[];
  accessibilityLevel?: 'basic' | 'enhanced' | 'full';
}

interface FeatureCategory {
  title: string;
  color: string;
  features: FeatureItem[];
}

const featureCategories: Record<string, FeatureCategory> = {
  analysis: {
    title: "AI Analysis Tools",
    color: "blue",
    features: [
      {
        id: "confidence-analysis",
        name: "Confidence Analysis",
        description: "Advanced diagnostic confidence scoring with evidence-based rationale",
        icon: TrendingUp,
        badge: "AI",
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      },
      {
        id: "risk-stratification", 
        name: "Risk Stratification",
        description: "Patient risk assessment and stratification for clinical decision-making",
        icon: AlertTriangle,
        badge: "Clinical",
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'enhanced'
      },
      {
        id: "second-opinion",
        name: "Second Opinion Analysis", 
        description: "Independent AI second opinion for complex cases",
        icon: UserCheck,
        isNew: true,
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      }
    ]
  },
  clinical: {
    title: "Clinical Decision Support",
    color: "green",
    features: [
      {
        id: "treatment-pathway",
        name: "Treatment Pathways",
        description: "Evidence-based treatment recommendations and clinical pathways",
        icon: Target,
        badge: "Guidelines",
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'enhanced'
      },
      {
        id: "drug-interactions",
        name: "Drug Interaction Checker",
        description: "Comprehensive medication interaction and safety analysis",
        icon: Pill,
        badge: "Safety",
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      },
      {
        id: "emergency-protocols",
        name: "Emergency Protocols",
        description: "Quick access to emergency response protocols and contact information",
        icon: Shield,
        badge: "Emergency",
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      }
    ]
  },
  education: {
    title: "Patient Education & Resources",
    color: "purple",
    features: [
      {
        id: "condition-library",
        name: "Condition Library",
        description: "Comprehensive database of medical conditions with patient-friendly explanations",
        icon: BookOpen,
        userTypes: ['patient', 'parent', 'caregiver'],
        accessibilityLevel: 'basic'
      },
      {
        id: "care-instructions",
        name: "Care Instructions",
        description: "Personalized care instructions and follow-up guidelines",
        icon: FileText,
        userTypes: ['patient', 'parent', 'caregiver'],
        accessibilityLevel: 'basic'
      },
      {
        id: "pediatric-resources",
        name: "Pediatric Resources",
        description: "Child-specific health resources and developmental guidelines",
        icon: Heart,
        badge: "Kids",
        userTypes: ['parent'],
        accessibilityLevel: 'basic'
      }
    ]
  },
  tools: {
    title: "Healthcare Tools",
    color: "teal",
    features: [
      {
        id: "symptom-tracker",
        name: "Symptom Tracker",
        description: "Track symptoms over time with visual analytics",
        icon: Activity,
        userTypes: ['patient', 'parent', 'caregiver'],
        accessibilityLevel: 'basic'
      },
      {
        id: "medication-reminders",
        name: "Medication Reminders",
        description: "Smart medication scheduling and reminder system",
        icon: Clock,
        userTypes: ['patient', 'parent', 'caregiver'],
        accessibilityLevel: 'basic'
      },
      {
        id: "health-reports",
        name: "Health Reports",
        description: "Generate comprehensive health reports and summaries",
        icon: BarChart3,
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'enhanced'
      }
    ]
  },
  accessibility: {
    title: "Accessibility Features",
    color: "orange",
    features: [
      {
        id: "high-contrast",
        name: "High Contrast Mode",
        description: "Enhanced visual contrast for better readability",
        icon: Eye,
        category: 'accessibility',
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      },
      {
        id: "large-text",
        name: "Large Text Mode",
        description: "Increased font sizes for improved readability",
        icon: Search,
        category: 'accessibility',
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'basic'
      },
      {
        id: "voice-navigation",
        name: "Voice Navigation",
        description: "Navigate the application using voice commands",
        icon: MessageSquare,
        category: 'accessibility',
        isNew: true,
        userTypes: ['patient', 'parent', 'caregiver', 'healthcare_professional'],
        accessibilityLevel: 'full'
      },
      {
        id: "api-testing",
        name: "API Testing Dashboard",
        description: "Comprehensive API testing and validation tools",
        icon: Settings,
        category: 'accessibility',
        isNew: true,
        userTypes: ['healthcare_professional'],
        accessibilityLevel: 'full'
      }
    ]
  }
};

const EnhancedNavigationSidebar: React.FC<EnhancedNavigationSidebarProps> = ({
  isOpen,
  onToggle,
  onFeatureSelect,
  activeFeature,
  consultationCount = 0,
  isConsultationMode = false,
  userType = 'patient',
  accessibilityLevel = 'basic'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('analysis');

  // Filter features based on user type and accessibility level
  const getFilteredFeatures = (features: FeatureItem[]) => {
    return features.filter(feature => {
      const userTypeMatch = !feature.userTypes || feature.userTypes.includes(userType);
      const accessibilityMatch = !feature.accessibilityLevel || 
        (accessibilityLevel === 'basic' && feature.accessibilityLevel === 'basic') ||
        (accessibilityLevel === 'enhanced' && ['basic', 'enhanced'].includes(feature.accessibilityLevel)) ||
        (accessibilityLevel === 'full');
      return userTypeMatch && accessibilityMatch;
    });
  };

  const getUserModeLabel = () => {
    switch (userType) {
      case 'patient': return 'Patient Mode';
      case 'parent': return 'Parent/Guardian Mode';
      case 'caregiver': return 'Caregiver Mode';
      case 'healthcare_professional': return 'Professional Mode';
      default: return 'Healthcare Mode';
    }
  };

  const handleFeatureClick = (featureId: string) => {
    onFeatureSelect(featureId);
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant];
  };

  return (
    <TooltipProvider>
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl border-r transition-all duration-300 z-50 enhanced-sidebar enhanced-sidebar-container ${
        isOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="font-bold text-gray-900">AI Features</h2>
                <p className="text-xs text-gray-600">Direct access to enhanced tools</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="p-1 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={isConsultationMode ? "default" : "secondary"} className="text-xs">
              {isConsultationMode ? "Consultation Active" : "Standalone Mode"}
            </Badge>
            {consultationCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {consultationCount} Sessions
              </Badge>
            )}
          </div>
        </div>

        {/* Category Navigation */}
        <div className="p-3 border-b bg-gray-50">
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(featureCategories) as Array<keyof typeof featureCategories>).map((categoryKey) => {
              const category = featureCategories[categoryKey];
              const isSelected = selectedCategory === categoryKey;
              return (
                <Button
                  key={categoryKey}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(categoryKey)}
                  className={`justify-start text-xs h-8 ${
                    isSelected 
                      ? `${getColorClasses(category.color, 'bg')} ${getColorClasses(category.color, 'text')} border ${getColorClasses(category.color, 'border')}` 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {category.title}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Features List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedCategory && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${getColorClasses(featureCategories[selectedCategory].color, 'bg')}`}></div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {featureCategories[selectedCategory].title}
                </h3>
              </div>
              
              <div className="space-y-2">
                {getFilteredFeatures(featureCategories[selectedCategory].features).map((feature: FeatureItem) => {
                  const isActive = activeFeature === feature.id;
                  const IconComponent = feature.icon;
                  
                  return (
                    <Tooltip key={feature.id}>
                      <TooltipTrigger asChild>
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md enhanced-sidebar-card ${
                            isActive 
                              ? `ring-2 ring-blue-400 ${getColorClasses(featureCategories[selectedCategory].color, 'bg')}` 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleFeatureClick(feature.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getColorClasses(featureCategories[selectedCategory].color, 'bg')}`}>
                                <IconComponent className={`w-4 h-4 ${getColorClasses(featureCategories[selectedCategory].color, 'text')}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {feature.name}
                                  </h4>
                                  {feature.isNew && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      New
                                    </Badge>
                                  )}
                                  {feature.isPro && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                      Pro
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {feature.description}
                                </p>
                                {feature.badge && (
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    {feature.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">{feature.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => onFeatureSelect('consultation-mode')}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Start New Consultation
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => onFeatureSelect('help')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Feature Guide
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 enhanced-sidebar-overlay"
          onClick={onToggle}
        />
      )}
    </TooltipProvider>
  );
};

export default EnhancedNavigationSidebar;
