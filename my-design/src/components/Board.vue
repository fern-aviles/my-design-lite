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
  let c = null
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const addRotor = (event) => {
    // addRotor function is still in development
    const radius = 10
    const circle = new fabric.Circle({
      left: event.offsetX - (radius),
      top: event.offsetY - (radius),
      fill: 'black',
      radius: radius,

    });
    circle.setControlsVisibility({
      bl: false,
      br: false,
      mb: false,
      ml: false,
      mr: false,
      mt: false,
      tl: false,
      tr: false,
      mtr: false,
    })
      c.add(circle)
  }

  onMounted(() => {
    // Creates the canvas and sets the canvas width and height
    // to the user's window size.
    const canvasValue = canvas.value
    c = new fabric.Canvas(canvasValue)
    c.setWidth(width.value)
    c.setHeight(height.value)
    c.on('mouse:down', (options) => {
      addRotor(options.e);
    })
  })
</script>