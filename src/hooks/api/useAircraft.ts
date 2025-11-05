import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useAircraft = (options?: { retry?: boolean; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['aircraft'],
    queryFn: () => apiService.getAircraft(),
    retry: options?.retry ?? false, // Don't retry on failure by default
    enabled: options?.enabled ?? true,
    throwOnError: false, // Don't throw errors, just return them
  });
};

export const useAircraftById = (id: string) => {
  return useQuery({
    queryKey: ['aircraft', id],
    queryFn: () => apiService.getAircraftById(id),
    enabled: !!id,
  });
};

export const useAircraftTypes = () => {
  return useQuery({
    queryKey: ['aircraft-types'],
    queryFn: () => apiService.getAircraftTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutes - types don't change often
    retry: false, // Don't retry on failure
    throwOnError: false, // Don't throw errors, just return them
  });
};

export const useCreateAircraft = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiService.createAircraft(data),
    onMutate: async (newAircraft) => {
      await queryClient.cancelQueries({ queryKey: ['aircraft'] });
      const previousAircraft = queryClient.getQueryData(['aircraft']);
      
      // Optimistically add the new aircraft
      queryClient.setQueryData(['aircraft'], (old: any) => [
        ...(old || []),
        { ...newAircraft, id: `temp-${Date.now()}`, status: 'active' }
      ]);
      
      return { previousAircraft };
    },
    onError: (error: Error, _, context) => {
      queryClient.setQueryData(['aircraft'], context?.previousAircraft);
      toast({
        title: "Failed to add aircraft",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Aircraft added",
        description: "New aircraft has been added to your fleet",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
};

export const useUpdateAircraft = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateAircraft(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['aircraft', id] });
      const previousAircraft = queryClient.getQueryData(['aircraft', id]);
      
      queryClient.setQueryData(['aircraft', id], (old: any) => ({
        ...old,
        ...data,
      }));
      
      return { previousAircraft };
    },
    onError: (error: Error, variables, context) => {
      queryClient.setQueryData(['aircraft', variables.id], context?.previousAircraft);
      toast({
        title: "Failed to update aircraft",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Aircraft updated",
        description: "Aircraft information has been updated",
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['aircraft', variables.id] });
    },
  });
};

export const useDeleteAircraft = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteAircraft(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['aircraft'] });
      const previousAircraft = queryClient.getQueryData(['aircraft']);
      
      // Optimistically remove the aircraft
      queryClient.setQueryData(['aircraft'], (old: any) =>
        old?.filter((aircraft: any) => aircraft.id !== id)
      );
      
      return { previousAircraft };
    },
    onError: (error: Error, _, context) => {
      queryClient.setQueryData(['aircraft'], context?.previousAircraft);
      toast({
        title: "Failed to remove aircraft",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Aircraft removed",
        description: "Aircraft has been removed from your fleet",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
};
