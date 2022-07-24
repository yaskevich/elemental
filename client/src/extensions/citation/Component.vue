<template>
  <node-view-wrapper as="span" class="citation" draggable="true" data-drag-handle>
    {{ source.citekey }}
    <!-- <button @click="process">{{ node.attrs.id }}</button> -->
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
const props = defineProps(nodeViewProps);
const source = props.node.attrs.data.filter((x:IBib) => x.id === props.node.attrs.id).shift();
// console.log(source);

// const process = () => {
  // props.updateAttributes({
  //   count: props.node.attrs.count + 1,
  // })
//   console.log(props.node.attrs.id);
// };

</script>

<style lang="scss">
.citation {
  margin: 0px 5px;
  background: #CCFFFF;
  padding: 0px 2px;
  border-radius: 3px;
  border: 2px solid black;
}
</style>
