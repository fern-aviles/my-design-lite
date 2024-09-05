<template>
  <div>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lnag="ts">
  import { Canvas, Circle, Group } from 'fabric';
  import { ref, onMounted } from 'vue';
  import {WaterGroup} from '@/util/waterGroup.ts'
  // import Water from '@/util/water';
  import { HunterProduct } from '@/util/product';
  const canvas = ref(null);
  let c = null;
  let i = 0;
  const RADIUS = 100,
        START_ANGLE = 0,
        END_ANGLE = 270;

  const createRotor = (e) => {
    const rotor = new Circle({
      left: e.offsetX,
      top: e.offsetY, 
      originX: 'center',
      originY: 'center',
      radius: 7,
      fill: 'gray',
      hasControls: false,
      product: true,
    });

    const water = new Water({
      startAngle: START_ANGLE,
      endAngle: END_ANGLE,
      centerX: rotor.left,
      centerY: rotor.top,
      radius: RADIUS,
      canvas: c,
      fill: 'rgba(255, 0, 0, .2)',
    }, rotor);
    // console.log(e)
    // Assign the water instance to rotor.water after creation
    // rotor.water = water;
    // c.setActiveObject(rotor);

  }

  const addWaterGroup = (e) => {
    const rotor = new HunterProduct({
      productID: "461006" || product.value,
      pressure: "45PSI" || pressure.value + "PSI",
      left: e.offsetX,
      top: e.offsetY,
      canvas: c,
    });
    // const productGroup = new WaterGroup({
    //     canvas: c
    //   });
  }

  onMounted(() => {
    const canvasValue = canvas.value;
    c = new Canvas(canvasValue, {
      preserveObjectStacking: false,
    });
    c.on({
      'mouse:up': (options) => {
        if(options.isClick && (!options.target)){
          // createRotor(options.e);
          addWaterGroup(options.e);
          i++;
          console.log(i)
      }},
      'selection:created': (e) => {
      }
    
    });
    c.renderAll();
  });
</script>