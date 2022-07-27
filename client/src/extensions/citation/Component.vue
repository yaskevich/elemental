<template>
  <node-view-wrapper as="span" class="citation" draggable="true" data-drag-handle>
    <n-tooltip trigger="hover" @click="$router.push(`/source/${node.attrs.id}`)" width="300">
      <template #trigger>
        <span style="white-space:nowrap;">
          <n-icon :component="ArticleFilled" style="vertical-align: middle;" />
          {{ source?.citekey }}
        </span>
      </template>
      <span v-html="html"></span>
    </n-tooltip>

    <!-- <button @click="process">{{ node.attrs.id }}</button> -->
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { ArticleFilled } from '@vicons/material';
import Cite from 'citation-js';

const props = defineProps(nodeViewProps);
const source = props.extension.options.sources.filter((x: IBib) => x.id === props.node.attrs.id)?.[0];
const html = (new Cite(source?.bibtex)).format('bibliography', { format: 'html', template: 'apa', lang: source?.lang });

const clicked = () => {
  console.log("Source is clicked!");
};


// console.log(props);

// const process = () => {
  // props.updateAttributes({
  //   count: props.node.attrs.count + 1,
  // })
//   console.log(props.node.attrs.id);
// };

</script>

<style lang="scss">
.citation {
  font-weight: bold;
  border: 2px solid silver;
  background: #ccffff;
  padding: 0px 2px;
  /*
  margin: 0px 5px;
  border-radius: 3px;
  border: 2px solid black;
  */
}
</style>
