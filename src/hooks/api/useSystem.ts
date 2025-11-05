import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';

export const useSystemStatus = (options?: { autoRefresh?: boolean }) => {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => apiService.getSystemStatus(),
    refetchInterval: options?.autoRefresh ? 10 * 1000 : false, // 10 seconds
  });
};

export const useSystemMetrics = (options?: { autoRefresh?: boolean; retry?: boolean; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: () => apiService.getSystemMetrics(),
    refetchInterval: options?.autoRefresh ? 30 * 1000 : false, // 30 seconds
    retry: options?.retry ?? false, // Don't retry on failure by default
    enabled: options?.enabled ?? true,
    throwOnError: false, // Don't throw errors, just return them
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => apiService.getDetailedHealth(),
  });
};

export const useSystemLogs = () => {
  return useQuery({
    queryKey: ['system', 'logs'],
    queryFn: () => apiService.getSystemLogs(),
  });
};

export const useDatabaseStatus = () => {
  return useQuery({
    queryKey: ['system', 'database'],
    queryFn: () => apiService.getDatabaseStatus(),
  });
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system', 'settings'],
    queryFn: () => apiService.getSystemSettings(),
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: any) => apiService.updateSystemSettings(settings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['system', 'settings'] });
      const previousSettings = queryClient.getQueryData(['system', 'settings']);
      
      queryClient.setQueryData(['system', 'settings'], newSettings);
      
      return { previousSettings };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['system', 'settings'], context?.previousSettings);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'settings'] });
    },
  });
};
