import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useApiKeys = () => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiService.getApiKeys(),
  });
};

export const useCreateApiKey = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: "API key created",
        description: "New API key has been generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateApiKey = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: "API key updated",
        description: "API key has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteApiKey = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: "API key deleted",
        description: "API key has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
