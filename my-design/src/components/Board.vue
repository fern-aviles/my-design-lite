<!-- This file contains the canvas the user will be using to design
 their sprinkler layout  -->

<template>
  <h1>canvas</h1>
  <canvas ref="canvas" @click="addRotor"></canvas>

</template>

<script setup lnag="ts">
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'

  const canvas = ref(null)
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const addRotor = (event) => {
    // addRotor function is still in development
    console.log("Clicked on canvas")
    const canvasValue = canvas.value
    const c = new fabric.Canvas(canvasValue)
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      fill: 'red',
      width: 100,
      height: 100,
    });
      c.add(rect)
  }

  onMounted(() => {
    // Creates the canvas and sets the canvas width and height
    // to the user's window size.
    const canvasValue = canvas.value
    const c = new fabric.Canvas(canvasValue)
    c.setWidth(width.value)
    c.setHeight(height.value)
    c.on('mouse:down', (options) => {
      addRotor(options.e);
    })
  })
</script>