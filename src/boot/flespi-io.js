/* eslint-disable */
import VueConnection from 'flespi-io-js/dist/vue-plugin'
import { version } from '../../package.json'

let rest = '',
  socket = ''

console.log('[flespi-io] Environment check:', {
  DEV,
  PROD,
  LOCAL,
  hostname: window.location.hostname,
  host: window.location.host,
  pathname: window.location.pathname
});

/* if local dev build */
if (DEV && LOCAL) {
  if (window.location.host.indexOf('localhost') !== -1) {
    rest = 'https://localhost:9005'
    socket = 'wss://localhost:9017'
  }
} else if (PROD) {
  // For production deployments (like Vercel), always use flespi.io servers
  // unless it's specifically hosted on flespi.io domain
  if (window.location.host.indexOf('flespi.io') !== -1) {
    if (window.location.pathname.indexOf('/toolbox') !== -1) {
      rest = `https://${window.location.host}`
      socket = `wss://${window.location.host}`
    }
  }
  // For all other production deployments (Vercel, etc.), use default flespi.io servers
  // This ensures proper CORS and connection handling
}

console.log('[flespi-io] Connection configuration:', {
  rest: rest || 'https://flespi.io',
  socket: socket || 'wss://mqtt.flespi.io'
});

const isDev = DEV || (PROD && window.location.host.indexOf('flespi.io') === -1)
const mqttSettings = { protocolVersion: 5, wsOptions: { objectMode: false, perMessageDeflate: true } }
const clientId = `toolbox-${version}${isDev ? '-dev' : ''}-${Math.random().toString(16).substr(2, 8)}`

console.log('[flespi-io] Client configuration:', {
  clientId,
  isDev,
  mqttSettings
});

const connectionConfig = {
  socketConfig: {
    server: socket,
    clientId,
    mqttSettings
  },
  httpConfig: { server: rest ? rest : undefined, flespiApp: clientId }
}

export default ({ Vue, store }) => {
  Vue.prototype.$authHost = rest || 'https://flespi.io'
  Vue.prototype.$flespiServer = rest || 'https://flespi.io'
  Vue.prototype.$flespiSocketServer = socket || 'wss://mqtt.flespi.io'
  Vue.prototype.$flespiApp = clientId
  
  console.log('[flespi-io] Vue prototypes set:', {
    $authHost: Vue.prototype.$authHost,
    $flespiServer: Vue.prototype.$flespiServer,
    $flespiSocketServer: Vue.prototype.$flespiSocketServer,
    $flespiApp: Vue.prototype.$flespiApp
  });
  
  Vue.use(VueConnection, connectionConfig)
  
  Vue.connector.socket.on('connect', (connack) => {
    console.log('[flespi-io] Socket connected:', connack);
    try {
      const tokenInfo = JSON.parse(connack.properties.userProperties.token)
      console.log('[flespi-io] Token info received:', tokenInfo);
      store.commit('setTokenInfo', tokenInfo)
      store.commit('setSocketOffline', false)
    } catch (error) {
      console.error('[flespi-io] Error parsing token info:', error);
    }
  })
  
  Vue.connector.socket.on('error', (error) => {
    console.error('[flespi-io] Socket error:', error);
    store.commit('reqFailed', error)
  })
  
  Vue.connector.socket.on('offline', () => {
    console.log('[flespi-io] Socket offline');
    store.commit('setSocketOffline', true)
  })
  
  if (window) {
    window.addEventListener('beforeunload', () => {
      Vue.connector.socket.close(true)
    })
  }
}
