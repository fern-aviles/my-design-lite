<template>
  <div>
    <p> Add 
      <input v-model="groups"> rows of 
      <input v-model="singles">
      <select v-model="type">
        <option v-for="option in options" :value="option.value">
          {{ option.text }}
        </option>
       </select>
    </p>
    <input type="checkbox" v-model="inGroup">
    <label> Grouped </label>
    <button @click="createGroups()"> Add </button>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, Circle, FabricText, Group, Line, Path, Polygon } from 'fabric';
  const canvas = ref();
  let c = null as Canvas | null;
  let offsetX = 0;
  let offsetY = 10;
  const radius = 10;
  const groups = ref(100);
  const singles = ref(100);
  const type = ref('2');
  const inGroup = ref(true);
  const options = ref([
    {text: "circles", value: '1'},
    {text: "paths", value: '2'},
    {text: "polygons", value: '3'},
  ]);

  const createGroup = () => {
    const activeSelection = c!.getActiveObjects();
    console.log(activeSelection)
    const group = new Group(activeSelection);
    // Remove the active selection from the canvas
    c!.remove(...activeSelection);

    // Add the new group to the canvas
    c!.add(group);

    // Set the group as the active object
    c!.setActiveObject(group);

    // Render the changes on the canvas
    c!.renderAll();

  }

  const createGroups = () => {
    console.time("forLoopTimer");
    for(let i = 0; i < groups.value; i++){
      if(type.value === '1'){
        createCircles(singles.value);
      }
      else if(type.value === '2'){
        createPaths(singles.value);
      }
      else if(type.value === '3'){
        createPolygons(singles.value);
      }
    }
    console.timeEnd("forLoopTimer");
  }

  const createCircles = (num: number) => {
    const group = new Group();
    for(let i = 0; i < num; i++){
      const circle = createCircle();
      if(inGroup.value){
        c?.remove(circle);
        group.add(circle);
      }
    }
    if(inGroup.value) c?.add(group);
    offsetY += 10;
    offsetX = 0;
  }

  const createPolygons = (num: number) => {
    
    const group = new Group();
    for(let i = 0; i < num; i++){
      const polygon = createPolygon();
      if(inGroup.value){
        c?.remove(polygon);
        group.add(polygon);
      }
    }
    if(inGroup.value) c?.add(group);
    offsetY += 10;
    offsetX = 0;
  }

  const createPaths = (num: number) => {
    const group = new Group();
    for(let i = 0; i < num; i++){
      const path = createPath();
      if(inGroup.value){
        c?.remove(path);
        group.add(path);
      }
    }
    if(inGroup.value) c?.add(group);
    offsetY += 10;
    offsetX = 0;
  }

  const createCircle = () => {
    const circle = new Circle({
      left: offsetX,
      top: offsetY,
      fill: 'rgba(255, 0, 0, .2)',
      radius: radius,
    });

    c!.add(circle);
    offsetX += radius/2;
    if(offsetX > 500){
      offsetY += radius/2;
      offsetX = 0;
    } 
    return circle;
  }
  const createPolygon = () => {  
    const points = [];
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
      fill: 'rgba(0, 0, 255, .2)',
      selectable: true,
    });
    c!.add(circlePolygon);
    offsetX += radius/2;
    if(offsetX > 500){
      offsetY += radius;
      offsetX = 0;
    } 
    return circlePolygon;
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
      fill: 'rgba(0, 0, 0, .2)',
      selectable: true,
    });

    c!.add(circlePath);
    offsetX += radius/2;
    if(offsetX > 500){
      offsetY += radius/2;
      offsetX = 0;
    } 

    return circlePath;

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
        if(type.value === '1'){
          createCircle();
        }
        else if(type.value === '2'){
          createPath();
        }
        else if(type.value === '3'){
          createPolygon();
      }
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