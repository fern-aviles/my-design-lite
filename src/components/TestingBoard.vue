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

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, FabricText, Line } from 'fabric';
  import { Water } from '@/util/water'
  import { HunterProduct } from '@/util/product'
  import { Controller } from '@/util/controller';
  import { MPStrip, MPStripwater } from '@/util/strip';
  const canvas = ref();
  let c = null as Canvas | null;
  let waterScale = 20;
  let products = 0;
  let rotorCreation = false;

  const pressure = ref('30');
  const product = ref('179291');
  const options = ref([
    { text: 'PGP Ultra', value: '862' },
    { text: 'MP Rotator', value: '461006' },
    { text: 'Pro Adjustable Nozzles', value:'884' },
    { text: 'MP Strip', value: '179291'}
  ]);
  interface NozzleDictionary {
  [key: number]: {
    show: boolean;
    // other properties
  };
}
  let newNozzles = [];
  let nozzle = ref();

  // Create a reactive nozzles container
  const nozzles = ref<NozzleDictionary>({});

  // Watch for changes in the nozzles selection
  watch(
    nozzles,
    () => {
      console.log('Nozzle options updated');
    },
    { deep: true }
  );

  const onChange = (e: any) => {
    e = c!.getActiveObject();
    // It's a HunterProduct
    if(e instanceof HunterProduct){
      e.setNozzle(nozzle.value);
    }
      // It's a controller
    else if(e instanceof Controller){
      let product = e.water.product as HunterProduct;
      product.setNozzle(nozzle.value);
    }
    else if (e instanceof MPStrip){
      e.setSelectedNozzle(nozzle.value)
    }
      // It's a controller
    else if(e instanceof MPStripwater){
      let product = e.product as MPStrip;
      product.setSelectedNozzle(nozzle.value);
    }
  }

  const createRotor = (e: any) => {
    if(product.value != '179291'){
      const rotor = new HunterProduct({
        productID: product.value,
        pressure: pressure.value + "PSI",
        left: e.offsetX,
        top: e.offsetY,
        productIndex: products,
        canvas: c,
      });
      c!.add(rotor);
      nozzles.value = {...rotor.nozzleOptions};
      c!.setActiveObject(rotor);
    }
    else{
    const mpstrip = new MPStrip({
      productID: 179291,
      pressure: pressure.value + "PSI",
      left: e.offsetX,
      top: e.offsetY,
      productIndex: products,
      width: 20,
      height: 10,
      fill: 'black',
      canvas: c,
    });
    c!.add(mpstrip);
    nozzles.value = {...mpstrip.nozzleOptions};
    c!.setActiveObject(mpstrip);
    }
  }

  const createMPStrip = (e: any) => {
    const mpstrip = new MPStrip({
      productID: product.value,
      pressure: pressure.value + "PSI",
      left: e.offsetX,
      top: e.offsetY,
      productIndex: products,
      canvas: c,
    });
    c!.add(mpstrip);
    nozzles.value = {...mpstrip.nozzleOptions};
    c!.setActiveObject(mpstrip);
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
      else if(options.target instanceof HunterProduct){
        newNozzles = options.target.nozzleOptions;
        nozzles.value = {...newNozzles};

        const nozzleSelected = options.target.getSelectedNozzle();
        nozzle.value = nozzleSelected;
      }
      // Clicking on a controller
      else if(options.target instanceof Controller){
        let product: HunterProduct = options.target.water.product as HunterProduct;
        newNozzles = product.nozzleOptions;
        nozzles.value = {...newNozzles};

        nozzle.value = product.getSelectedNozzle();
      }
      // Clicking nowhere and object is not added
      else if(!options.target){
        nozzles.value = {};
        nozzle.value = "";
      }
      else if (options.target instanceof MPStrip){
        newNozzles = options.target.nozzleOptions;
        nozzles.value = {...newNozzles};

        const nozzleSelected = options.target.getSelectedNozzle();
        nozzle.value = nozzleSelected;
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