/** Veil model IDs match their shipped filenames directly. */
export function veilModelUrl(id: string, folder: '' | 'hair/' = ''): string {
  if (!/^Veil_(Female|Male)_[A-Za-z0-9_]+$/.test(id)) throw new Error('Invalid Veil model ID');
  return '/assets/' + folder + id + '.glb';
}
