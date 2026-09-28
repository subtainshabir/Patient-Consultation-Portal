import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export interface PlaceholderModulePageProps {
  title: string;
  subtitle: string;
  targetPhase: string;
  icon: LucideIcon;
  plannedFeatures: string[];
}

export const PlaceholderModulePage: React.FC<PlaceholderModulePageProps> = ({
  title,
  subtitle,
  targetPhase,
  icon: Icon,
  plannedFeatures,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={title}
        description={subtitle}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Modules' },
          { label: title },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        }
      />

      <Card className="max-w-3xl border-dashed">
        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-medical-50 border border-medical-200 text-medical-700 flex items-center justify-center mb-6 shadow-sm">
            <Icon className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-navy-700 text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-medical-600" />
            <span>Target Release: {targetPhase}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 tracking-tight mb-2">
            Module coming soon
          </h2>
          <p className="text-sm text-navy-600 max-w-lg leading-relaxed mb-8">
            This section will be implemented in a future development phase. The underlying architecture,
            routing, and responsive layout are fully ready.
          </p>

          {/* Planned Specifications Preview */}
          <div className="w-full max-w-lg bg-navy-50/70 rounded-xl p-5 border border-navy-100 text-left">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-medical-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800">
                Planned Functionality for {title}
              </h3>
            </div>
            <ul className="space-y-2">
              {plannedFeatures.map((feature, idx) => (
                <li key={idx} className="text-xs text-navy-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-1.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
