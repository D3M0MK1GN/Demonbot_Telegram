import { useRoute } from "wouter";
import { useCase, useUpdateCaseStatus } from "@/hooks/use-cases";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, DollarSign, Smartphone, Landmark, ShieldCheck, 
  MapPin, Clock, FileText, CheckCircle2 
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CaseDetail() {
  const [, params] = useRoute("/cases/:id");
  const id = parseInt(params?.id || "0");
  const { data: caseData, isLoading } = useCase(id);
  const updateStatus = useUpdateCaseStatus();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white">Case Not Found</h2>
          <Link href="/cases" className="text-primary hover:underline mt-4 inline-block">Return to list</Link>
        </div>
      </Layout>
    );
  }

  const handleStatusChange = (val: string) => {
    updateStatus.mutate({ id, status: val as any }, {
      onSuccess: () => {
        toast({ title: "Status Updated", description: `Case status changed to ${val.replace('_', ' ')}` });
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/cases">
          <Button variant="ghost" size="icon" className="hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-white font-mono">{caseData.caseNumber}</h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            Created on {format(new Date(caseData.createdAt!), 'PPP')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Select 
              value={caseData.status} 
              onValueChange={handleStatusChange}
              disabled={updateStatus.isPending}
            >
              <SelectTrigger className="w-[180px] bg-card border-white/10 capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="denunciado">Denunciado</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Incident Description
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {caseData.description || "No description provided."}
            </p>
          </div>

          {/* Evidence Grid */}
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Evidence
            </h3>
            {caseData.evidences && caseData.evidences.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {caseData.evidences.map((ev: any) => (
                  <div key={ev.id} className="aspect-square bg-black/20 rounded-lg border border-white/5 flex items-center justify-center relative group overflow-hidden">
                    {/* Placeholder for evidence display logic */}
                    <span className="text-xs text-muted-foreground uppercase">{ev.type}</span>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-black/20 rounded-lg border border-white/5 border-dashed">
                No evidence attached yet.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Case Details</h3>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="w-4 h-4" />
                Amount Lost
              </div>
              <span className="font-mono text-white font-medium">
                {caseData.amountLost ? `$${Number(caseData.amountLost).toLocaleString()}` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Smartphone className="w-4 h-4" />
                Suspect Phone
              </div>
              <span className="font-mono text-white">
                {caseData.suspectNumber || 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Landmark className="w-4 h-4" />
                Bank Entity
              </div>
              <span className="text-white capitalize">
                {caseData.bankEntity || 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <span className="text-white">
                {caseData.city}, {caseData.country || 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                Incident Date
              </div>
              <span className="text-white text-sm">
                {caseData.incidentDate ? format(new Date(caseData.incidentDate), 'MMM d, yyyy') : '-'}
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Victim Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                {caseData.user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-white">{caseData.user?.fullName || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground font-mono">{caseData.user?.telegramId}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">ID: <span className="text-white ml-2">{caseData.user?.identificationNumber || '-'}</span></p>
              <p className="text-muted-foreground">Phone: <span className="text-white ml-2">{caseData.user?.phoneNumber || '-'}</span></p>
              <p className="text-muted-foreground">City: <span className="text-white ml-2">{caseData.user?.residenceCity || '-'}</span></p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
