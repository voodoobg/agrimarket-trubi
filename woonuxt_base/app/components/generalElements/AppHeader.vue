<script setup lang="ts">
const { isShowingSearch } = useSearching();
</script>

<template>
  <header class="sticky top-0 z-40 bg-white shadow-sm shadow-light-500">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center">
        <MenuTrigger class="lg:hidden" />
        <NuxtLink to="/" class="logo-text md:w-[160px]">Agro Flow</NuxtLink>
      </div>
      <MainMenu class="items-center hidden gap-6 text-sm text-gray-500 lg:flex lg:px-4" />
      <div class="flex justify-end items-center md:w-[160px] flex-1 ml-auto gap-4 md:gap-6">
        <ProductSearch class="hidden sm:inline-flex max-w-[320px] w-[60%]" />
        <SearchTrigger />
        <div class="flex gap-4 items-center">
          <SignInLink />
          <CartTrigger />
        </div>
      </div>
    </div>
    <Transition name="scale-y" mode="out-in">
      <div class="container mb-3 -mt-1 sm:hidden" v-if="isShowingSearch">
        <ProductSearch class="flex w-full" />
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.logo-text {
  color: #7f54b2;
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.logo-text:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 1.5rem;
  }
}
</style>
