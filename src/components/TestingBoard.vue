<template>
  <div>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lnag="ts">
  import { Canvas, FabricText, Line } from 'fabric';
  import { ref, onMounted } from 'vue';
  import { Water } from '@/util/water.ts'
  import { Product } from '@/util/product.ts'
  const canvas = ref(null);
  let c = null;
  let waterScale = 20;

  const createRotor = (e) => {
    const rotor = new Product({
      productID: '862',
      left: e.offsetX,
      top: e.offsetY,
      canvas: c,
    });
    c.add(rotor);
    c.setActiveObject(rotor);
  }

  onMounted(() => {
  const canvasValue = canvas.value;
  c = new Canvas(canvasValue, {
    preserveObjectStacking: false,
  });
  const feetScale = 5*waterScale
  const line = new Line([10, 10, feetScale, 10],{
    left: 10,
    top: 10,
    stroke: 'black',
  });
  const scaleText = new FabricText(`${feetScale/waterScale} feet`, {
    left: (10 + feetScale) * .5,
    top: line.top,
    originX: 'center',
    fontSize: 15,
  });
  c.add(line, scaleText)
  c.on('mouse:up', (options) => {
      if(options.isClick && (!options.target || options.target instanceof Water)){
        createRotor(options.e);
    }
  });
  c.renderAll();
  });
</script>