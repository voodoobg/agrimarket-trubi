<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();
const slug = route.params.slug;

const isShowingCached = ref(false);
const isLoading = ref(!import.meta.server);
const cacheKey = `category-products-${slug}`;

// Only use cache on client-side
if (import.meta.client) {
  const { getCachedData } = useProductCache();
  const cachedProducts = getCachedData<Product[]>(cacheKey);
  
  if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
    setProducts(cachedProducts);
    isShowingCached.value = true;
    isLoading.value = false;
  }
}

// Fetch products with caching per category - use lazy mode to show loading spinner
const { data, pending } = await useAsyncData(
  cacheKey,
  async () => {
    const result = await GqlGetProducts({ slug, first: 500 });
    isLoading.value = false;
    return result;
  },
  {
    lazy: true,
    getCachedData: (key) => useNuxtApp().payload.data[key] || useNuxtApp().static.data[key],
  }
);

const productsInCategory = computed(() => (data.value?.products?.nodes || []) as Product[]);
const hasProducts = computed(() => productsInCategory.value.length > 0);
const showLoading = computed(() => (pending.value || isLoading.value) && !isShowingCached.value);

// Set products when data is available and save to cache
watch(productsInCategory, (products) => {
  if (products && Array.isArray(products) && products.length > 0) {
    setProducts(products);
    if (import.meta.client) {
      const { setCachedData } = useProductCache();
      setCachedData(cacheKey, products);
    }
    isShowingCached.value = false;
  } else if (products && Array.isArray(products) && products.length === 0) {
    // Ensure empty array is set even if no products
    setProducts([]);
  }
}, { immediate: true });

onMounted(() => {
  if (!isQueryEmpty.value) updateProductList();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'product-category-slug') return;
    updateProductList();
  },
);

useHead({
  title: 'Products',
  meta: [{ hid: 'description', name: 'description', content: 'Products' }],
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
      <Filters v-if="storeSettings.showFilters" :hide-categories="true" />

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
    <NoProductsFound v-else>No products found in this category.</NoProductsFound>
  </div>
</template>
