import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => apiService.getReports(),
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => apiService.getReport(id),
    enabled: !!id,
  });
};

export const useGenerateReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiService.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: "Report generated",
        description: "Your report has been generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useExportReportPDF = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiService.exportReportPDF(id),
    onSuccess: () => {
      toast({
        title: "Export started",
        description: "Your PDF report is being downloaded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useExportReportCSV = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiService.exportReportCSV(id),
    onSuccess: () => {
      toast({
        title: "Export started",
        description: "Your CSV report is being downloaded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: "Report deleted",
        description: "Report has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
