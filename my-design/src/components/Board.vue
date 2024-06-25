<template>
  <h1>canvas</h1>
  <button>Add Rotor </button>
  <canvas ref="canvas" width="200" height="200"></canvas>

</template>

<script setup lnag="ts">
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'

  const canvas = ref(null)
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  onMounted(() => {
    const c = new fabric.Canvas(canvas.value)
    c.setWidth(width.value)
    c.setHeight(height.value)
    console.log(width.value)
    console.log(height.value)
  })
</script>