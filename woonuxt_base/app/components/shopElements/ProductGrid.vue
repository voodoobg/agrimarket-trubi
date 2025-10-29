<script setup lang="ts">
const route = useRoute();
const { productsPerPage } = useHelpers();
const { products, isProductsLoading } = useProducts();
const page = ref(parseInt(route.params.pageNumber as string) || 1);
const productsToShow = computed(() => (products.value || []).slice((page.value - 1) * productsPerPage, page.value * productsPerPage));
const hasProducts = computed(() => Array.isArray(products.value) && products.value && products.value.length > 0);

// Show loading when explicitly loading OR when products is null (not initialized)
const isLoading = computed(() => isProductsLoading.value || products.value === null);
const showNoProducts = computed(() => !isLoading.value && !hasProducts.value);
</script>

<template>
  <Transition name="fade" mode="out-in">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 min-h-[400px]">
      <LoadingIcon size="60" />
      <p class="mt-4 text-lg text-gray-600">Loading products...</p>
    </div>
    
    <!-- Products loaded -->
    <section v-else-if="hasProducts" class="relative w-full">
      <TransitionGroup name="shrink" tag="div" mode="in-out" class="product-grid">
        <ProductCard v-for="(node, i) in productsToShow" :key="node.id || i" :node :index="i" />
      </TransitionGroup>
      <Pagination />
    </section>
    
    <!-- No products (only after loading) -->
    <NoProductsFound v-else-if="showNoProducts" />
  </Transition>
</template>

<style lang="postcss" scoped>
.product-grid {
  @apply my-4 min-h-[600px] grid transition-all gap-8 lg:my-8;

  grid-template-columns: repeat(2, 1fr);
}
.product-grid:empty {
  display: none;
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  }
}

.shrink-move {
  transition: all 400ms;
}

.shrink-leave-active {
  transition: transform 300ms;
  position: absolute;
  opacity: 0;
}

.shrink-enter-active {
  transition:
    opacity 400ms ease-out 200ms,
    transform 400ms ease-out;
  will-change: opacity, transform;
}

.shrink-enter,
.shrink-leave-to,
.shrink-enter-from {
  opacity: 0;
  transform: scale(0.75) translateY(25%);
}
</style>
