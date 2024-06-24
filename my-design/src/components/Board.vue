<template>
  <h1>canvas</h1>
  <canvas ref="canvas" width="200" height="200"></canvas>
</template>

<script setup lnag="ts">
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'

  const canvas = ref(null)
  onMounted(() => {
    const c = new fabric.Canvas(canvas.value)
  })
</script>