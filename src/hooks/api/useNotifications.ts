import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = (options?: { autoRefresh?: boolean }) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiService.getNotifications(),
    refetchInterval: options?.autoRefresh ? 30 * 1000 : false, // 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old: any) =>
        old?.map((notif: any) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      return { previousNotifications };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old: any) =>
        old?.filter((notif: any) => notif.id !== id)
      );
      
      return { previousNotifications };
    },
    onError: (error: Error, _, context) => {
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
      toast({
        title: "Failed to delete notification",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notifications as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
