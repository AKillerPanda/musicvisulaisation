import { useMutation } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useStartLivepeerStream() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (streamName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.startLivepeerStream(streamName);
    },
  });
}

export function useGetLivepeerStreamStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (streamId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getLivepeerStreamStatus(streamId);
    },
  });
}

