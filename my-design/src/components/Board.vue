<!-- This file contains the canvas the user will be using to design
 their sprinkler layout  -->

<template>
  <h1>canvas</h1>
  <canvas ref="canvas"></canvas>
</template>

<script setup lnag="ts">
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'

  const canvas = ref(null)
  let c = null
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  let onRotor = false

  const changeOnRotor = (options, on) =>{
    onRotor = on
  }

  const addRotor = (event) => {
    // addRotor function should add a circle on the canvas. 
    // The circle that is added should be draggable but not resizable
    // Selecting multiple circles should not make another circle?
    // Group selecting should not be allow the user to resize circles?

    const radius = 10
    if (onRotor){
      return
    }
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

    circle.on('mouseover', (options) => {
      changeOnRotor(options, true)
    })
    circle.on('mouseout', (options) => {
      changeOnRotor(options, false)
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