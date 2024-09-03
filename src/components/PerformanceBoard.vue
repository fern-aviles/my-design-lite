<template>
  <div>
    <button @click="createCircles(100)"> Add 100 Circles </button>
    <button @click="createPolygons(100)"> Add 100 Polygons</button>
    <button @click="createPaths(100)"> Add 100 Paths</button>
    <button @click="createGroup()"> Group </button>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, Circle, FabricText, Group, Line, Path, Polygon } from 'fabric';
  const canvas = ref();
  let c = null as Canvas | null;
  let offsetX = 10;
  let offsetY = 10
  const radius = 5;

  const createGroup = () => {
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

  const createPolygons = (num: number) => {
    for(let i = 0; i < num; i++){
      createPolygon()
    }
  }
  const createPaths = (num: number) => {
    for(let i = 0; i < num; i++){
      createPath()
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
  const createPolygon = () => {  const points = [];
    const sides = 720;
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      points.push({ x, y });
    }

    // Create the polygon with the generated points
    const circlePolygon = new Polygon(points, {
      left: offsetX,
      top: offsetY,
      strokeWidth: 2,
      selectable: true,
    });
    c!.add(circlePolygon);
    offsetX += radius*2;
    if(offsetX > 500){
      offsetY += radius*2;
      offsetX = 0;
    } 
  }

  const createPath = () => {
    const pathString = [
      `M ${radius},0`,                // Move to the starting point on the circumference
      `a ${radius},${radius} 0 1,0 ${2 * radius},0`,  // Draw the top half of the circle
      `a ${radius},${radius} 0 1,0 -${2 * radius},0`  // Draw the bottom half of the circle
    ].join(' ');

    // Create the path object
    const circlePath = new Path(pathString, {
      left: offsetX,
      top: offsetY,
      strokeWidth: 2,
      selectable: true,
    });

    c!.add(circlePath);
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
        createPolygon();
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