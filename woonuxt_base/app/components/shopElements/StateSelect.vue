<script setup>

const props = defineProps({
  modelValue: { type: String, default: '' },
  countryCode: { type: String, default: '' },
});

const { getStatesForCountry, countryStatesDict } = useCountry();
const emit = defineEmits(['update:modelValue', 'change']);

const localValue = ref(props.modelValue);

// Sync local value with prop changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue;
});

function select(evt) {
  const value = evt.target.value;
  localValue.value = value;
  emit('update:modelValue', value);
  emit('change', value);
}

async function updateState() {
  if (props.countryCode && props.countryCode.length > 0) {
    await getStatesForCountry(props.countryCode);
  }
}

onMounted(() => {
  updateState();
});

watch(
  () => props.countryCode,
  () => {
    updateState();
  },
);
</script>

<template>
  <select v-if="countryStatesDict[props.countryCode]?.length" :value="localValue" @change="select" class="h-[42px]">
    <option value="">Select a state</option>
    <option v-for="state in countryStatesDict[props.countryCode]" :key="state.code" :value="state.code">
      {{ state.name }}
    </option>
  </select>
  <input v-else type="text" :value="localValue" @input="select" placeholder="State" />
</template>
