<script setup>
const { locales, locale, setLocaleCookie } = useI18n();

// Set Bulgarian as default if no locale is set
onMounted(() => {
  if (!locale.value || locale.value === 'en_US') {
    locale.value = 'bg_BG';
  }
});

watch(locale, (newLocale) => {
  if (newLocale) setLocaleCookie(newLocale);
});
</script>

<template>
  <select id="language-switcher" v-model="locale" aria-label="Language switcher" class="bg-white">
    <option v-for="locale in locales" :key="locale" :value="locale.code" v-html="locale.name" />
  </select>
</template>
