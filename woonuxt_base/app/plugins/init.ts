export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.env.SSR) {
    console.log('🔌 [Init Plugin] Starting...');
    
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
        console.error('❌ [Init Plugin] GraphQL Error:', err);
        const serverErrors = ['The iss do not match with this server', 'Invalid session token'];
        if (serverErrors.includes(err?.gqlErrors?.[0]?.message)) {
          console.warn('⚠️ [Init Plugin] Server error detected, clearing cookies and reloading');
          clearAllCookies();
          clearAllLocalStorage();
          window.location.reload();
        }
      });

      if (!success) {
        console.warn('⚠️ [Init Plugin] Cart refresh failed');
        
        // Use localStorage for reload count to survive cookie clearing
        const reloadCount = localStorage.getItem('init-reload-count');
        const reloadTimestamp = localStorage.getItem('init-reload-timestamp');
        const now = Date.now();
        
        console.log('🔌 [Init Plugin] Reload count check:', { reloadCount, reloadTimestamp, now });
        
        // Reset reload count if it's been more than 5 minutes
        if (reloadTimestamp && (now - parseInt(reloadTimestamp)) > 300000) {
          console.log('🔌 [Init Plugin] Reload count expired, resetting');
          localStorage.removeItem('init-reload-count');
          localStorage.removeItem('init-reload-timestamp');
        }
        
        if (!reloadCount || reloadCount === '0') {
          console.warn('🔄 [Init Plugin] First failure, setting reload count and preparing reload...');
          
          // Set reload count and timestamp BEFORE clearing anything
          localStorage.setItem('init-reload-count', '1');
          localStorage.setItem('init-reload-timestamp', now.toString());
          
          // Now clear cookies
          clearAllCookies();
          // Note: Don't clear localStorage here as it contains our reload count
          
          // Log out the user
          const { logoutUser } = useAuth();
          await logoutUser();
          
          console.warn('🔄 [Init Plugin] Triggering page reload...');
          window.location.reload();
        } else {
          console.warn('⚠️ [Init Plugin] Already reloaded (count: ' + reloadCount + '), BLOCKING reload to prevent infinite loop!');
          // Don't clear the count - let it expire naturally after 5 minutes
          return;
        }
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
