<script lang="ts">
  import "../app.css";
  import { Nav } from "$lib";
  import { ModeWatcher } from "mode-watcher";
  export let data: { user: { id: number; username: string } };
</script>

<ModeWatcher defaultMode={"dark"} />

<div class="min-h-full flex flex-col">
  <Nav user={data.user} />
  <slot/>
</div>
