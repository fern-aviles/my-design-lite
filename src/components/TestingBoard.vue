<template>
  <div>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lnag="ts">
  import { Canvas, Circle } from 'fabric';
  import { ref, onMounted } from 'vue';
  import { Water } from '@/util/water.ts'
  import { Product } from '@/util/product.ts'
  const canvas = ref(null);
  let c = null;

  const createRotor = (e) => {
    const rotor = new Product({
      productID: '892',
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
  c.on('mouse:up', (options) => {
      if(options.isClick && (!options.target || options.target instanceof Water)){
        createRotor(options.e);
    }
  });
  c.renderAll();
  });
</script>