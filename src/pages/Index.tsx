import { Activity, TrendingUp, AlertTriangle, Plane, Database } from "lucide-react";
import { GenomicCard } from "@/components/genomic/GenomicCard";
import { ConservationScore } from "@/components/genomic/ConservationScore";
import { Button } from "@/components/ui/button";
import { DocumentationModal } from "@/components/modals/DocumentationModal";
import { useNavigate } from "react-router-dom";
import { useSystemMetrics } from "@/hooks/api/useSystem";
import { useFlights } from "@/hooks/api/useFlights";
import { useAircraft } from "@/hooks/api/useAircraft";
import { StatsCardSkeleton, FlightCardSkeleton } from "@/components/shared/LoadingStates";
import { ErrorState } from "@/components/shared/ErrorState";
import heroImage from "@/assets/hero-aviation.jpg";

const Index = () => {
  const navigate = useNavigate();
  
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useSystemMetrics({ autoRefresh: true });
  const { data: flights, isLoading: flightsLoading, error: flightsError, refetch: refetchFlights } = useFlights({ limit: 3, autoRefresh: true });
  const { data: aircraft, isLoading: aircraftLoading } = useAircraft();

  const stats = [
    { 
      title: "Active Flights", 
      value: metrics?.active_flights || "0", 
      change: metrics?.active_flights_change || "+0%", 
      icon: Activity,
      type: "multirotor"
    },
    { 
      title: "Analyses Complete", 
      value: metrics?.total_analyses || "0", 
      change: metrics?.analyses_change || "+0%", 
      icon: TrendingUp,
      type: "fixed-wing"
    },
    { 
      title: "Risk Alerts", 
      value: metrics?.risk_alerts || "0", 
      change: metrics?.alerts_change || "0%", 
      icon: AlertTriangle,
      type: "high"
    },
    { 
      title: "Fleet Health", 
      value: metrics?.fleet_health ? `${metrics.fleet_health}%` : "0%", 
      change: metrics?.fleet_health_change || "+0%", 
      icon: Plane,
      type: "low"
    },
  ];

  const recentAnalyses = flights?.slice(0, 3) || [];

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
        <div className="relative p-8 md:p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              DBX
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Genomic-inspired precision analysis for flight safety and performance optimization.
              Advanced AI algorithms detect anomalies with scientific rigor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={() => navigate("/upload")}
              >
                <Activity className="h-5 w-5 mr-2" />
                Start Analysis
              </Button>
              <DocumentationModal>
                <Button variant="outline" size="lg">
                  View Documentation
                </Button>
              </DocumentationModal>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {metricsError && (
        <ErrorState 
          message={metricsError.message} 
          onRetry={refetchMetrics}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          stats.map((stat) => (
            <GenomicCard key={stat.title} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className={`risk-indicator ${stat.type === 'multirotor' ? 'aircraft-multirotor' : 
                  stat.type === 'fixed-wing' ? 'aircraft-fixed-wing' : 
                  stat.type === 'high' ? 'risk-high' : 'risk-low'}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </GenomicCard>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Flight Analyses */}
        <div className="lg:col-span-2">
          <GenomicCard 
            title="Recent Flight Analyses"
            icon={<Activity className="h-5 w-5" />}
            badge="Live Updates"
            badgeVariant="low"
          >
            {flightsError && (
              <ErrorState 
                message={flightsError.message} 
                onRetry={refetchFlights}
              />
            )}
            <div className="space-y-4">
              {flightsLoading ? (
                <>
                  <FlightCardSkeleton />
                  <FlightCardSkeleton />
                  <FlightCardSkeleton />
                </>
              ) : recentAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent analyses found
                </div>
              ) : (
                recentAnalyses.map((analysis: any) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`h-3 w-3 rounded-full ${
                          analysis.status === 'completed' ? 'bg-accent animate-genomic-pulse' : 'bg-primary animate-spin'
                        }`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-primary">{analysis.id || analysis.flight_id}</span>
                          <span className={`risk-indicator ${
                            analysis.aircraft_type === 'Multirotor' ? 'aircraft-multirotor' : 
                            analysis.aircraft_type === 'Fixed Wing' ? 'aircraft-fixed-wing' : 'aircraft-vtol'
                          }`}>
                            {analysis.aircraft_type || analysis.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{analysis.aircraft_name || analysis.aircraft}</p>
                        <p className="text-xs text-muted-foreground">{analysis.timestamp || analysis.created_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <ConservationScore 
                        label="Confidence"
                        score={analysis.confidence || analysis.confidence_score || 0}
                        variant="primary"
                        className="w-20 sm:w-24"
                      />
                    </div>
                  </div>
                ))
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/analysis")}
              >
                View All Analyses
              </Button>
            </div>
          </GenomicCard>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <GenomicCard 
            title="System Health"
            icon={<Database className="h-5 w-5" />}
            badge="Online"
            badgeVariant="low"
          >
            <div className="space-y-4">
              <ConservationScore 
                label="AI Model Performance"
                score={98.7}
                variant="success"
              />
              <ConservationScore 
                label="Data Pipeline Throughput"
                score={94.2}
                variant="primary"
              />
              <ConservationScore 
                label="Storage Capacity"
                score={67.8}
                variant="warning"
              />
              <div className="pt-2 border-t border-border/30">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="text-foreground">24</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Queue Length</span>
                  <span className="text-foreground">0</span>
                </div>
              </div>
            </div>
          </GenomicCard>

          <GenomicCard 
            title="Fleet Overview"
            icon={<Plane className="h-5 w-5" />}
            badge={`${aircraft?.filter((a: any) => a.status === 'active').length || 0} Active`}
            badgeVariant="fixed-wing"
          >
            <div className="space-y-3">
              {aircraftLoading ? (
                <>
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Multirotors</span>
                    <span className="text-multirotor font-medium">
                      {aircraft?.filter((a: any) => a.type === 'Multirotor').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fixed Wing</span>
                    <span className="text-fixed-wing font-medium">
                      {aircraft?.filter((a: any) => a.type === 'Fixed Wing').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VTOL</span>
                    <span className="text-vtol font-medium">
                      {aircraft?.filter((a: any) => a.type === 'VTOL').length || 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <ConservationScore 
                      label="Fleet Availability"
                      score={metrics?.fleet_availability || 0}
                      variant="accent"
                    />
                  </div>
                </>
              )}
            </div>
          </GenomicCard>
        </div>
      </div>
    </div>
  );
};

export default Index;