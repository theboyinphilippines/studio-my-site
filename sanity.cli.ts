import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'hgjts5tp',
    dataset: 'production'
  },
  deployment: {
    /**
     * Auto-updates are deliberately off: a deploy here should pin the Studio to
     * the version in this repo, not silently roll Sanity packages forward.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  },
})
