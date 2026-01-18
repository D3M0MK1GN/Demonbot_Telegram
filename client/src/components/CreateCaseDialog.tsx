import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCaseSchema } from "@shared/schema";
import { useCreateCase } from "@/hooks/use-cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Extend schema for form validation
const formSchema = insertCaseSchema.extend({
  amountLost: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCaseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const createCase = useCreateCase();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "otro",
      status: "nuevo",
      amountLost: 0,
    }
  });

  const onSubmit = (data: FormValues) => {
    createCase.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Case Created",
          description: "New case has been successfully logged.",
        });
        reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Log New Cybercrime Incident</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Crime Type</Label>
              <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="otro">
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phishing">Phishing</SelectItem>
                  <SelectItem value="hackeo_whatsapp">WhatsApp Hack</SelectItem>
                  <SelectItem value="hackeo_email">Email Hack</SelectItem>
                  <SelectItem value="extorsion">Extortion</SelectItem>
                  <SelectItem value="otro">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amountLost">Amount Lost (USD)</Label>
              <Input 
                id="amountLost" 
                type="number" 
                {...register("amountLost")} 
                className="bg-background/50 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suspectNumber">Suspect Phone</Label>
              <Input 
                id="suspectNumber" 
                {...register("suspectNumber")} 
                className="bg-background/50 border-white/10"
                placeholder="+1 234 567 890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankEntity">Bank Entity</Label>
              <Input 
                id="bankEntity" 
                {...register("bankEntity")} 
                className="bg-background/50 border-white/10"
                placeholder="Bank Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Incident Description</Label>
            <Textarea 
              id="description" 
              {...register("description")} 
              className="bg-background/50 border-white/10 min-h-[100px]"
              placeholder="Describe what happened..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCase.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createCase.isPending ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
