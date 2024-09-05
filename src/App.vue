
<template>
  <div>
    <TestingBoard/>
  </div>
</template>
  
<script>
  import Board from './components/Board.vue';
  import ProductBoard from './components/ProductBoard.vue';
  import TestingBoard from './components/TestingBoard.vue';

  export default{
    components: {
      Board,
      TestingBoard,
      ProductBoard
    }
  }


</script>

<style scoped>
</style>
