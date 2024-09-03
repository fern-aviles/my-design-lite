<template>
  <div>
    <button @click="createCircles(100)"> Add 100 </button>
    <button @click="createGroup()"> Group </button>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, Circle, FabricText, Group, Line } from 'fabric';
  const canvas = ref();
  let c = null as Canvas | null;
  let offsetX = 10;
  let offsetY = 10
  const radius = 5;

  const createGroup = () => {
    console.log(123)
    const activeSelection = c!.getActiveObjects();
    console.log(activeSelection)
    const group = new Group(activeSelection, {
      // left: activeSelection.left,
      // top: activeSelection.top,
    });
    // Remove the active selection from the canvas
    c!.remove(...activeSelection);

    // Add the new group to the canvas
    c!.add(group);

    // Set the group as the active object
    c!.setActiveObject(group);

    // Render the changes on the canvas
    c!.renderAll();

  }

  const createCircles = (num: number) => {
    for(let i = 0; i < num; i++){
      createCircle()
    }
  }

  const createCircle = () => {
    const circle = new Circle({
      left: offsetX,
      top: offsetY,
      radius: radius,
    });

    c!.add(circle);
    offsetX += radius*2;
    if(offsetX > 500){
      offsetY += radius*2;
      offsetX = 0;
    } 
    

  }

  onMounted(() => {
  const canvasValue = canvas.value;
  c = new Canvas(canvasValue, {
    preserveObjectStacking: false,
  });
  c.on({
    'mouse:up': (options) => {
      // Clicking on no objects/water object
      if(options.isClick){
        createCircle();
      }
    },
  });
  c.renderAll();
  })
</script>

<style>
p{
  display: inline;
}
</style>