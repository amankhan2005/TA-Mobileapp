import { create } from 'zustand';

/**
 * appVersionStore — holds the version check result for the session.
 *
 * checkStatus values:
 *  'idle'      — check not yet run
 *  'checking'  — API call in progress
 *  'upToDate'  — installed version is current
 *  'optional'  — update available, user can dismiss
 *  'force'     — installed < minimum, user must update
 *  'error'     — check failed and no usable cache
 */
const useAppVersionStore = create((set) => ({
  checkStatus:   'idle',
  versionConfig: null,   // raw config from API/cache

  setChecking:   ()       => set({ checkStatus: 'checking' }),
  setUpToDate:   ()       => set({ checkStatus: 'upToDate' }),
  setOptional:   (config) => set({ checkStatus: 'optional', versionConfig: config }),
  setForce:      (config) => set({ checkStatus: 'force',    versionConfig: config }),
  setError:      ()       => set({ checkStatus: 'error' }),

  // User dismissed the optional update modal — proceed to app
  dismissOptional: () => set({ checkStatus: 'upToDate' }),
}));

export default useAppVersionStore;
