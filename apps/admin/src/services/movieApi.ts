import type { ImportedMovie, Movie, MovieInput, PresignedUpload } from '@/types';
import { apiRequest } from './apiClient';

export function fetchMovies(): Promise<Movie[]> {
  return apiRequest<Movie[]>('/movies');
}

/** Fetch + map TMDB metadata for a movie link (server-side, key stays hidden). */
export function importMovieFromTmdb(url: string): Promise<ImportedMovie> {
  return apiRequest<ImportedMovie>(`/movies/import?url=${encodeURIComponent(url)}`);
}

/**
 * Ask the API for a presigned S3 URL to upload the raw movie file. The backend
 * reuses an existing entry's slot when the same title/year is seen again.
 */
export function requestUploadUrl(title: string, year: number | null): Promise<PresignedUpload> {
  return apiRequest<PresignedUpload>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ title, year }),
  });
}

/** Upload a file straight to S3 via a presigned PUT URL, reporting progress. */
export function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () =>
      reject(new Error('Upload failed — check the bucket CORS configuration.'));
    xhr.send(file);
  });
}

export function createMovie(input: MovieInput): Promise<Movie> {
  return apiRequest<Movie>('/movies', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMovie(id: string, patch: Partial<MovieInput>): Promise<Movie> {
  return apiRequest<Movie>(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function deleteMovie(id: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/movies/${id}`, { method: 'DELETE' });
}
