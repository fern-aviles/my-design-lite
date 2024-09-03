
<template>
  <div>
    <PerformanceBoard/>
  </div>
</template>
  
<script>
  import Board from './components/Board.vue';
  import TestingBoard from './components/TestingBoard.vue';
  import PerformanceBoard from './components/PerformanceBoard.vue';

  export default{
    components: {
      Board,
      TestingBoard,
      PerformanceBoard
    }
  }


</script>

<style scoped>
</style>
