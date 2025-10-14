<script setup lang="ts">
const route = useRoute();
const { products } = useProducts();
const { productsPerPage } = useHelpers();
const page = ref(parseInt(route.params.pageNumber as string) || 1);
const productsCount = computed(() => products.value?.length || 0);
</script>

<template>
  <div class="text-sm font-light" v-if="productsCount !== 0">
    <span>{{ $t('messages.shop.productResultCount.showing') + ' ' }}</span>
    <span class="font-normal">{{ (page - 1) * productsPerPage + 1 + ' ' }}</span>
    <span>{{ $t('messages.shop.productResultCount.to') + ' ' }}</span>
    <span class="font-normal">{{ Math.min(page * productsPerPage, productsCount) + ' ' }}</span>
    (<span>{{ $t('messages.shop.productResultCount.of') }}</span> <span class="font-normal">{{ productsCount }}</span
    >)
  </div>
</template>
