<script setup lang="ts">
console.log('🔵 [Products Page] Script setup started');

const { setProducts, updateProductList } = useProducts();
const route = useRoute();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

const isShowingCached = ref(false);
const isLoading = ref(true); // Always start as loading for consistent SSR/CSR
const fetchCount = ref(0);

console.log('🔵 [Products Page] Initial setup complete', { isServer: import.meta.server });

// Only use cache on client-side
if (import.meta.client) {
  const { getCachedData } = useProductCache();
  const cachedProducts = getCachedData<Product[]>('all-products');
  
  if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
    console.log('✅ [Products Page] Loaded from cache', { count: cachedProducts.length });
    setProducts(cachedProducts);
    isShowingCached.value = true;
    isLoading.value = false;
  } else {
    console.log('⚠️ [Products Page] No cache found');
  }
}

// Fetch products with reasonable limit to prevent timeout (reduce from 1000 to 200)
const { data, pending, error } = await useAsyncData(
  'all-products',
  async () => {
    fetchCount.value++;
    console.log('🔴 [GraphQL] Fetching products...', { attempt: fetchCount.value, timestamp: new Date().toISOString() });
    const startTime = performance.now();
    
    try {
      const result = await GqlGetProducts({ first: 300 }); // Reduced from 1000 to prevent timeout
      const endTime = performance.now();
      console.log('✅ [GraphQL] Products fetched', { 
        count: result?.products?.nodes?.length || 0, 
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        attempt: fetchCount.value 
      });
      isLoading.value = false;
      return result;
    } catch (err) {
      console.error('❌ [GraphQL] Failed to fetch products:', err);
      isLoading.value = false;
      throw err;
    }
  },
  {
    lazy: true,
    watch: [], // Don't watch any dependencies to prevent re-fetching
    getCachedData: (key) => useNuxtApp().payload.data[key] || useNuxtApp().static.data[key],
  }
);

// Log any errors
watch(error, (newError) => {
  if (newError) {
    console.error('❌ [Products Page] Error loading products:', newError);
  }
});

console.log('🔵 [Products Page] useAsyncData setup complete', { pending: pending.value });

const allProducts = computed(() => (data.value?.products?.nodes || []) as Product[]);
const hasProducts = computed<boolean>(() => Array.isArray(allProducts.value) && allProducts.value.length > 0);
const showLoading = computed(() => (pending.value || isLoading.value) && !isShowingCached.value);
const showNoProducts = computed(() => !showLoading.value && !hasProducts.value && !isShowingCached.value);

// Set products when data is available and save to cache
watch(allProducts, (products, oldProducts) => {
  console.log('👁️ [Products Page] Products watcher triggered', { 
    newCount: products?.length || 0, 
    oldCount: oldProducts?.length || 0,
    timestamp: new Date().toISOString() 
  });
  
  if (products && Array.isArray(products) && products.length > 0) {
    console.log('💾 [Products Page] Setting products', { count: products.length });
    setProducts(products);
    if (import.meta.client) {
      const { setCachedData } = useProductCache();
      setCachedData('all-products', products);
      console.log('💾 [Products Page] Saved to cache');
    }
    isShowingCached.value = false;
  } else if (products && Array.isArray(products) && products.length === 0) {
    console.log('⚠️ [Products Page] Setting empty products array');
    setProducts([]);
  }
}, { immediate: true });

let isMounted = false;
onMounted(() => {
  if (isMounted) {
    console.warn('⚠️ [Products Page] onMounted called multiple times - possible infinite loop!');
    return;
  }
  isMounted = true;
  
  console.log('🟢 [Products Page] Component mounted', { isQueryEmpty: isQueryEmpty.value });
  if (!isQueryEmpty.value) {
    console.log('🔄 [Products Page] Updating product list on mount');
    updateProductList();
  }
});

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    console.log('🔄 [Products Page] Route query changed', { 
      routeName: route.name,
      newQuery, 
      oldQuery,
      isSame: JSON.stringify(newQuery) === JSON.stringify(oldQuery)
    });
    
    // Don't update if route is not products page
    if (route.name !== 'products') {
      console.log('⏭️ [Products Page] Skipping - not on products page');
      return;
    }
    
    // Don't update if query hasn't actually changed
    if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) {
      console.log('⏭️ [Products Page] Skipping - query unchanged');
      return;
    }
    
    console.log('🔄 [Products Page] Updating product list from query watch');
    updateProductList();
  },
);

useHead({
  title: `Products`,
  meta: [{ name: 'description', content: 'Discover our products' }],
});
</script>

<template>
  <div class="container min-h-[500px]">
    <ClientOnly>
      <!-- Loading State (only show if no cached data) -->
      <div v-if="showLoading" class="flex flex-col items-center justify-center py-24">
        <LoadingIcon size="60" />
        <p class="mt-4 text-lg text-gray-600">Продуктите се зареждат...</p>
      </div>

      <!-- Products Loaded (from cache or fresh) -->
      <div v-else-if="hasProducts || isShowingCached" class="flex items-start gap-16">
        <Filters v-if="storeSettings.showFilters" />

        <div class="w-full">
          <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
            <ProductResultCount />
            <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
            <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
          </div>
          <ProductGrid />
        </div>
      </div>

    <!-- No Products (only show after loading is done) -->
    <NoProductsFound v-else-if="showNoProducts">No products found. Please try adjusting your filters or check back later.</NoProductsFound>
      
      <!-- Fallback for SSR -->
      <template #fallback>
        <div class="flex flex-col items-center justify-center py-24">
          <LoadingIcon size="60" />
          <p class="mt-4 text-lg text-gray-600">Продуктите се зареждат...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
