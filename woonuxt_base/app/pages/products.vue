<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const route = useRoute();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

const isShowingCached = ref(false);
const isLoading = ref(!import.meta.server);

// Only use cache on client-side
if (import.meta.client) {
  const { getCachedData } = useProductCache();
  const cachedProducts = getCachedData<Product[]>('all-products');
  
  if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
    setProducts(cachedProducts);
    isShowingCached.value = true;
    isLoading.value = false;
  }
}

// Fetch all products with caching - use lazy mode to show loading spinner
const { data, pending } = await useAsyncData(
  'all-products',
  async () => {
    const result = await GqlGetProducts({ first: 1000 });
    isLoading.value = false;
    return result;
  },
  {
    lazy: true,
    getCachedData: (key) => useNuxtApp().payload.data[key] || useNuxtApp().static.data[key],
  }
);

const allProducts = computed(() => (data.value?.products?.nodes || []) as Product[]);
const hasProducts = computed<boolean>(() => Array.isArray(allProducts.value) && allProducts.value.length > 0);
const showLoading = computed(() => (pending.value || isLoading.value) && !isShowingCached.value);

// Set products when data is available and save to cache
watch(allProducts, (products) => {
  if (products && Array.isArray(products) && products.length > 0) {
    setProducts(products);
    if (import.meta.client) {
      const { setCachedData } = useProductCache();
      setCachedData('all-products', products);
    }
    isShowingCached.value = false;
  }
}, { immediate: true });

onMounted(() => {
  if (!isQueryEmpty.value) updateProductList();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'products') return;
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
    <!-- Loading State (only show if no cached data) -->
    <div v-if="showLoading" class="flex flex-col items-center justify-center py-24">
      <LoadingIcon size="60" />
      <p class="mt-4 text-lg text-gray-600">Loading products...</p>
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

    <!-- No Products -->
    <NoProductsFound v-else>No products found. Please try adjusting your filters or check back later.</NoProductsFound>
  </div>
</template>
