<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();
const slug = route.params.slug;
const { getCachedData, setCachedData } = useProductCache();

// Try to load from localStorage cache immediately for instant display
const cacheKey = `category-products-${slug}`;
const cachedProducts = getCachedData<Product[]>(cacheKey);
const isShowingCached = ref(false);

if (cachedProducts && cachedProducts.length > 0) {
  setProducts(cachedProducts);
  isShowingCached.value = true;
}

// Fetch products with caching per category
const { data, pending } = await useAsyncData(
  cacheKey,
  () => GqlGetProducts({ slug, first: 500 }),
  {
    getCachedData: (key) => useNuxtApp().payload.data[key] || useNuxtApp().static.data[key],
  }
);

const productsInCategory = computed(() => (data.value?.products?.nodes || []) as Product[]);
const hasProducts = computed(() => productsInCategory.value.length > 0);

// Set products when data is available and save to cache
watch(productsInCategory, (products) => {
  if (products.length > 0) {
    setProducts(products);
    setCachedData(cacheKey, products);
    isShowingCached.value = false;
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
    <div v-if="pending && !isShowingCached" class="flex flex-col items-center justify-center py-24">
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
