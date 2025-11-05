<script lang="ts" setup>
console.log('🏠 [Home Page] Script setup started');

import { ProductsOrderByEnum } from '#woo';
const { siteName, description, shortDescription, siteImage } = useAppConfig();

console.log('🔴 [Home Page GraphQL] Fetching categories...', { 
  isServer: import.meta.server, 
  isClient: import.meta.client 
});

const { data: categoriesData, error: categoriesError, refresh: refreshCategories } = await useAsyncData(
  'home-categories', // Static cache key
  async () => {
    console.log('🔵 [Home Page] Categories fetch function executing...', {
      isServer: import.meta.server,
      isClient: import.meta.client,
      gqlHost: import.meta.server ? process.env.GQL_HOST : 'client-side'
    });
    const result = await GqlGetProductCategories({ first: 6 });
    const nodes = result?.productCategories?.nodes || [];
    console.log('✅ [Home Page] Categories fetched:', { 
      count: nodes.length,
      isServer: import.meta.server 
    });
    return nodes;
  },
  {
    // Disable SSR for home page to avoid "[nuxt] instance unavailable" error
    server: false,
    lazy: true,
  }
);

console.log('📊 [Home Page] Categories data state:', {
  hasData: !!categoriesData.value,
  count: categoriesData.value?.length || 0,
  hasError: !!categoriesError.value
});

const productCategories = computed(() => categoriesData.value || []);

console.log('✅ [Home Page GraphQL] Categories setup complete', { 
  count: productCategories.value.length
});

console.log('🔴 [Home Page GraphQL] Fetching popular products...', { 
  isServer: import.meta.server, 
  isClient: import.meta.client 
});

const { data: productData, error: productError, refresh: refreshProducts } = await useAsyncData(
  'home-popular-products', // Static cache key
  async () => {
    console.log('🔵 [Home Page] Products fetch function executing...', {
      isServer: import.meta.server,
      isClient: import.meta.client,
      gqlHost: import.meta.server ? process.env.GQL_HOST : 'client-side'
    });
    
    // Try with TOTAL_SALES (best-selling products)
    try {
      const result = await GqlGetProducts({ first: 5, orderby: ProductsOrderByEnum.TOTAL_SALES });
      const nodes = result?.products?.nodes || [];
      console.log('✅ [Home Page] Products fetched (by total sales):', { 
        count: nodes.length,
        isServer: import.meta.server 
      });
      return nodes;
    } catch (err) {
      console.warn('⚠️ [Home Page] Failed to fetch with orderby, trying without...', err);
      // Fallback: fetch without orderby
      const result = await GqlGetProducts({ first: 5 });
      const nodes = result?.products?.nodes || [];
      console.log('✅ [Home Page] Products fetched (no ordering):', { 
        count: nodes.length,
        isServer: import.meta.server 
      });
      return nodes;
    }
  },
  {
    // Disable SSR for home page to avoid "[nuxt] instance unavailable" error
    server: false,
    lazy: true,
  }
);

// Log any errors with full details
if (categoriesError.value) {
  console.error('❌ [Home Page] Categories error:', {
    error: categoriesError.value,
    message: categoriesError.value?.message,
    statusCode: categoriesError.value?.statusCode,
    data: categoriesError.value?.data,
    stack: categoriesError.value?.stack
  });
}
if (productError.value) {
  console.error('❌ [Home Page] Product error:', {
    error: productError.value,
    message: productError.value?.message,
    statusCode: productError.value?.statusCode,
    data: productError.value?.data,
    stack: productError.value?.stack
  });
}

const popularProducts = computed(() => productData.value || []);
console.log('✅ [Home Page GraphQL] Popular products setup complete', { 
  count: popularProducts.value.length,
  hasError: !!productError.value
});

// Add mounted hook to verify data on client and re-fetch if needed
onMounted(async () => {
  console.log('🟢 [Home Page] Component mounted', {
    categoriesCount: productCategories.value.length,
    productsCount: popularProducts.value.length,
    categoriesData: categoriesData.value,
    productData: productData.value
  });
  
  // If no data on mount, try refreshing
  if ((!productCategories.value || productCategories.value.length === 0) && !categoriesError.value) {
    console.warn('⚠️ [Home Page] No categories on mount, refreshing...');
    await refreshCategories();
  }
  
  if ((!popularProducts.value || popularProducts.value.length === 0) && !productError.value) {
    console.warn('⚠️ [Home Page] No products on mount, refreshing...');
    await refreshProducts();
  }
});

console.log('🏠 [Home Page] Setup complete');

// Preload full product list in background for faster /products page
// TEMPORARILY DISABLED to debug reload loop
// if (import.meta.client) {
//   console.log('🔄 [Home Page] Starting background product preload...');
//   
//   // Wait a bit to let the page render first
//   setTimeout(async () => {
//     const { getCachedData, setCachedData } = useProductCache();
//     
//     // Check if already cached
//     const cachedProducts = getCachedData<Product[]>('all-products');
//     
//     if (!cachedProducts || cachedProducts.length === 0) {
//       console.log('🔄 [Home Page] Preloading products in background...');
//       try {
//         const result = await GqlGetProducts({ first: 300 });
//         const products = result?.products?.nodes || [];
//         if (products.length > 0) {
//           setCachedData('all-products', products);
//           console.log('✅ [Home Page] Background preload complete', { count: products.length });
//         }
//       } catch (err) {
//         console.warn('⚠️ [Home Page] Background preload failed (non-critical):', err);
//       }
//     } else {
//       console.log('✅ [Home Page] Products already cached, skipping preload');
//     }
//   }, 2000); // Wait 2 seconds after page load
// }

useSeoMeta({
  title: `Home`,
  ogTitle: siteName,
  description: description,
  ogDescription: shortDescription,
  ogImage: siteImage,
  twitterCard: `summary_large_image`,
});
</script>

<template>
  <main>
    <HeroBanner />

    <div class="container flex flex-wrap items-center justify-center my-16 text-center gap-x-8 gap-y-4 brand lg:justify-between">
      <img src="/images/logoipsum-211.svg" alt="Brand 1" width="132" height="35" />
      <img src="/images/logoipsum-221.svg" alt="Brand 2" width="119" height="30" />
      <img src="/images/logoipsum-225.svg" alt="Brand 3" width="49" height="48" />
      <img src="/images/logoipsum-280.svg" alt="Brand 4" width="78" height="30" />
      <img src="/images/logoipsum-284.svg" alt="Brand 5" width="70" height="44" />
      <img src="/images/logoipsum-215.svg" alt="Brand 6" width="132" height="40" />
    </div>

    <section class="container my-16">
      <div class="flex items-end justify-between">
        <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
        <NuxtLink class="text-primary" to="/categories">{{ $t('messages.general.viewAll') }}</NuxtLink>
      </div>
      <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-6">
        <CategoryCard v-for="(category, i) in productCategories" :key="i" class="w-full" :node="category" />
      </div>
    </section>

    <section class="container grid gap-4 my-24 md:grid-cols-2 lg:grid-cols-4">
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img src="/icons/box.svg" width="60" height="60" alt="Free Shipping" loading="lazy" />
        <div>
          <h3 class="text-xl font-semibold">Free Shipping</h3>
          <p class="text-sm">Free shipping on order over €50</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img src="/icons/moneyback.svg" width="60" height="60" alt="Money Back" loading="lazy" />
        <div>
          <h3 class="text-xl font-semibold">Peace of Mind</h3>
          <p class="text-sm">30 days money back guarantee</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img src="/icons/secure.svg" width="60" height="60" alt="Secure Payment" loading="lazy" />
        <div>
          <h3 class="text-xl font-semibold">100% Payment Secure</h3>
          <p class="text-sm">Your payment are safe with us.</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img src="/icons/support.svg" width="60" height="60" alt="Support 24/7" loading="lazy" />
        <div>
          <h3 class="text-xl font-semibold">Support 24/7</h3>
          <p class="text-sm">24/7 Online support</p>
        </div>
      </div>
    </section>

    <section class="container my-16" v-if="popularProducts.length > 0">
      <div class="flex items-end justify-between">
        <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.popularProducts') }}</h2>
        <NuxtLink class="text-primary" to="/products">{{ $t('messages.general.viewAll') }}</NuxtLink>
      </div>
      <ProductRow :products="popularProducts" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
    </section>
    
    <!-- Debug section (remove after testing) -->
    <section class="container my-8 p-4 bg-yellow-100 rounded" v-if="popularProducts.length === 0 && productCategories.length === 0">
      <p class="text-red-600 font-bold">⚠️ Debug: No data loaded</p>
      <p>Categories: {{ productCategories.length }}</p>
      <p>Products: {{ popularProducts.length }}</p>
    </section>
    
    <!-- Show warning if only products failed but categories loaded -->
    <section class="container my-8 p-4 bg-blue-100 rounded" v-if="productCategories.length > 0 && popularProducts.length === 0">
      <p class="text-blue-600 font-bold">ℹ️ Info: Categories loaded but popular products failed</p>
      <p>This is usually okay - the categories section should still work.</p>
      <p>Check console for product fetch error details.</p>
    </section>
  </main>
</template>

<style scoped>
.brand img {
  max-height: min(8vw, 120px);
  object-fit: contain;
  object-position: center;
}
</style>
