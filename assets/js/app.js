import Alpine from 'alpinejs'
import { backToTopDock } from './components/back-to-top-dock.js'
import { headerChrome } from './components/header-chrome.js'
import { postProgress } from './components/post-progress.js'
import { searchUi } from './components/search-ui.js'
import { siteShell } from './components/site-shell.js'
import { tocUi } from './components/toc-ui.js'

window.Alpine = Alpine

Alpine.data('backToTopDock', backToTopDock)
Alpine.data('headerChrome', headerChrome)
Alpine.data('postProgress', postProgress)
Alpine.data('searchUi', searchUi)
Alpine.data('siteShell', siteShell)
Alpine.data('tocUi', tocUi)

Alpine.start()
