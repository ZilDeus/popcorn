<script lang="ts">
  import * as Alert from "$cui/alert";
  import { Loader, Check, X } from "lucide-svelte";
  export let submitting: boolean = false;
  export let success: boolean | null = null;
</script>

<div class="fixed w-full h-full" hidden={!submitting}>
  <div class="absolute bottom-2 right-4 w-1/4">
    <Alert.Root>
      {#if success == null}
        <Alert.Title>SUBMITTING...</Alert.Title>
        <Alert.Description>
          <Loader />
        </Alert.Description>
      {:else if success == true}
        <Alert.Title class="text-green-800">SUCCESS</Alert.Title>
        <Alert.Description>
          <Check color="green" />
        </Alert.Description>
      {:else}
        <Alert.Title class="text-red-800">ERROR</Alert.Title>
        <Alert.Description>
          <X color="red" />
        </Alert.Description>
      {/if}
    </Alert.Root>
  </div>
</div>
