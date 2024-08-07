<template>
  <div>
    <p> Enter PSI: </p>
    <input v-model="pressure" placeholder="45">

    <p> Select Product </p>
    <select v-model="product">
      <option v-for="option in options" :value="option.value">
        {{ option.text }}
      </option>
    </select>

    <p> Nozzles </p>
    <select v-model="nozzle" @change="onChange(nozzle)">
      <option v-for="(value, key) in nozzles"
              :key="key"
              :disabled="!value.show">
        {{ key }}
      </option>
    </select>
    <canvas ref="canvas" width="1600" height="1200"></canvas>
  </div>
</template>

<script setup lnag="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, Circle, FabricText, Line } from 'fabric';
  import { Water } from '@/util/water.ts'
  import { Product } from '@/util/product.ts'
  const canvas = ref(null);
  let c = null;
  let waterScale = 20;
  let products = 0;

  const pressure = ref('45');
  const product = ref('461006');
  const options = ref([
    { text: 'PGP Ultra', value: '862' },
    { text: 'MP Rotator', value: '461006' }
  ]);
  let newNozzles = [];
  let nozzle = ref(null);

  // Create a reactive nozzles container
  const nozzles = ref({});

  // Watch for changes in the nozzles selection
  watch(
    nozzles,
    () => {
      console.log('Nozzle options updated');
    },
    { deep: true }
  );

  const onChange = (e) => {
    e = c.getActiveObject();
    // It's a Product
    if(e instanceof Product){
      e.setNozzle(nozzle.value);
    }
      // It's a controller
    else if(e instanceof Circle){
      e.water.product.setNozzle(nozzle.value);
    }
  }

  const createRotor = (e) => {
    const rotor = new Product({
      productID: product.value,
      pressure: pressure.value + "PSI",
      left: e.offsetX,
      top: e.offsetY,
      productIndex: products,
      canvas: c,
    });
    c.add(rotor);
    nozzles.value = {...rotor.nozzleOptions};
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
  c.add(line, scaleText);
  c.on({
    'mouse:up': (options) => {
      // Clicking on no objects/water object
      if(options.isClick && (!options.target || options.target instanceof Water)){
        createRotor(options.e);
      }
      // Clicking on a product
      else if(options.target instanceof Product){
        newNozzles = options.target.nozzleOptions;
        nozzles.value = {...newNozzles};

        const nozzleSelected = options.target.getSelectedNozzle();
        nozzle.value = nozzleSelected;
      }
      // Clicking on a controller
      else if(options.target instanceof Circle){
        newNozzles = options.target.water.product.nozzleOptions;
        nozzles.value = {...newNozzles};

        nozzle.value = options.target.water.product.getSelectedNozzle();
      }
      // Clicking nowhere and object is not added
      else if(!options.target){
        nozzles.value = {};
        nozzle.value = "";
      }
      // Other selection
      else{
        console.log("Select a product or control.");
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