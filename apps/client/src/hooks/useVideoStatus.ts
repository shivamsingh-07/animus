import { useEffect, useState, type RefObject } from 'react';

export function useVideoStatus(videoRef: RefObject<HTMLVideoElement | null>) {
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onWaiting = () => setIsBuffering(true);
    const onResumePlay = () => setIsBuffering(false);
    const onError = () => setVideoError(true);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onResumePlay);
    video.addEventListener('canplay', onResumePlay);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onResumePlay);
      video.removeEventListener('canplay', onResumePlay);
      video.removeEventListener('error', onError);
    };
  }, [videoRef]);

  return { isBuffering, videoError, setVideoError };
}
