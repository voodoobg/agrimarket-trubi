// Global flag to ensure plugin only runs once
let pluginInitialized = false;

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.env.SSR) {
    // Prevent multiple executions in the same session
    if (pluginInitialized) {
      console.log('⏭️ [Init Plugin] Already initialized in this session, skipping');
      return;
    }
    
    console.log('🔌 [Init Plugin] Starting...', { 
      path: window.location.pathname,
      timestamp: Date.now() 
    });
    
    // Check if we're in a reload loop BEFORE doing anything
    const reloadTimestamp = localStorage.getItem('init-reload-timestamp');
    if (reloadTimestamp) {
      const timeSinceReload = Date.now() - parseInt(reloadTimestamp);
      console.log('🔌 [Init Plugin] Time since last reload:', timeSinceReload + 'ms');
      
      // If last reload was less than 10 seconds ago, we're in a loop - abort!
      if (timeSinceReload < 10000) {
        console.error('🚫 [Init Plugin] DETECTED RELOAD LOOP! Aborting init to prevent infinite reloads');
        pluginInitialized = true; // Mark as initialized to prevent retry
        // Clear the timestamp so user can try again after 10 seconds
        return;
      }
    }
    
    // Mark as initialized
    pluginInitialized = true;
    
    const { storeSettings } = useAppConfig();
    const { clearAllCookies, clearAllLocalStorage, getDomain } = useHelpers();
    const sessionToken = useCookie('woocommerce-session', { domain: getDomain(window.location.href) });
    
    if (sessionToken.value) {
      console.log('🔌 [Init Plugin] Session token found', { token: sessionToken.value.substring(0, 10) + '...' });
      useGqlHeaders({ 'woocommerce-session': `Session ${sessionToken.value}` });
    } else {
      console.log('🔌 [Init Plugin] No session token');
    }

    // Wait for the user to interact with the page before refreshing the cart, this is helpful to prevent excessive requests to the server
    let initialised = false;
    const eventsToFireOn = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click', 'resize', 'mousemove', 'mouseover'];

    async function initStore() {
      if (initialised) {
        console.log('⏭️ [Init Plugin] Already initialized, removing listeners');
        // We only want to execute this code block once, so we return if initialised is truthy and remove the event listeners
        eventsToFireOn.forEach((event) => {
          window.removeEventListener(event, initStore);
        });
        return;
      }

      initialised = true;
      console.log('🔄 [Init Plugin] Initializing store...');

      const { refreshCart } = useCart();
      const success: boolean = await refreshCart();
      console.log('🛒 [Init Plugin] Cart refresh result:', { success });

      useGqlError((err: any) => {
        // Only log actual GraphQL errors with messages
        if (err?.gqlErrors && err.gqlErrors.length > 0) {
          console.error('❌ [Init Plugin] GraphQL Error:', err);
          const serverErrors = ['The iss do not match with this server', 'Invalid session token'];
          if (serverErrors.includes(err?.gqlErrors?.[0]?.message)) {
            // Check if we recently reloaded to prevent loop
            const reloadTimestamp = localStorage.getItem('init-reload-timestamp');
            if (reloadTimestamp && (Date.now() - parseInt(reloadTimestamp)) < 10000) {
              console.error('🚫 [Init Plugin] Already reloaded recently, NOT reloading again to prevent loop');
              return;
            }
            
            console.warn('⚠️ [Init Plugin] Critical server error detected, clearing cookies and reloading');
            // Set timestamp FIRST before clearing anything
            const timestamp = Date.now().toString();
            localStorage.setItem('init-reload-timestamp', timestamp);
            
            clearAllCookies();
            // Don't clear localStorage - we need to preserve init-reload-timestamp
            // clearAllLocalStorage();
            
            window.location.reload();
          }
        } else {
          // Network/connection errors without GraphQL error details - just log as warning
          console.warn('⚠️ [Init Plugin] Network error (non-critical):', err?.statusCode || 'unknown');
        }
      });

      if (!success) {
        console.warn('⚠️ [Init Plugin] Cart refresh failed - continuing anyway (non-critical)');
        // Don't reload on cart refresh failure - it's not critical
        // The cart will just be empty, which is fine for browsing
      } else {
        console.log('✅ [Init Plugin] Store initialized successfully');
        // Clear any existing reload count on success
        const reloadCount = localStorage.getItem('init-reload-count');
        if (reloadCount) {
          console.log('🔌 [Init Plugin] Clearing reload count after successful init');
          localStorage.removeItem('init-reload-count');
          localStorage.removeItem('init-reload-timestamp');
        }
      }
    }

    // If we are in development mode, we want to initialise the store immediately
    const isDev = process.env.NODE_ENV === 'development';

    // Check if the current route path is one of the pages that need immediate initialization
    const pagesToInitializeRightAway = ['/checkout', '/my-account', '/order-summary'];
    const currentPath = useRoute().path;
    const isPathThatRequiresInit = pagesToInitializeRightAway.some((page) => currentPath.includes(page));

    const shouldInit = isDev || isPathThatRequiresInit || !storeSettings.initStoreOnUserActionToReduceServerLoad;

    console.log('🔌 [Init Plugin] Initialization decision:', {
      isDev,
      currentPath,
      isPathThatRequiresInit,
      shouldInit,
      initStoreOnUserActionToReduceServerLoad: storeSettings.initStoreOnUserActionToReduceServerLoad
    });

    if (shouldInit) {
      console.log('🔌 [Init Plugin] Initializing immediately...');
      initStore();
    } else {
      console.log('🔌 [Init Plugin] Waiting for user interaction...');
      eventsToFireOn.forEach((event) => {
        window.addEventListener(event, initStore, { once: true });
      });
    }
  }
  
  console.log('🔌 [Init Plugin] Plugin setup complete');
});
