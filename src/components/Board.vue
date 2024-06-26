<!-- This file contains the canvas the user will be using to design
 their sprinkler layout  -->

<template>
  <h1>canvas</h1>
  <canvas ref="canvas"></canvas>
</template>

<script setup lnag="ts">
  import { fabric } from 'fabric';
  import { ref, onMounted } from 'vue';

  const canvas = ref(null);
  let c = null;
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  /**
   * Adds a rotor to the canvas.
   * @param event : event
   * @returns null
   */
  const addRotor = (event) => {
    const radius = 10;
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
    });
    c.add(circle);
  };

  /**
   * Creates the canvas and sets its width and height to the 
   * user's window size.
   */
  onMounted(() => {
    const canvasValue = canvas.value;
    c = new fabric.Canvas(canvasValue);
    c.setWidth(width.value);
    c.setHeight(height.value);
    c.on({
      'mouse:up': (options) => {
        console.log(options);
        if(options.isClick && !options.target){
          addRotor(options.e);
        }
      },
    });
  });
</script>