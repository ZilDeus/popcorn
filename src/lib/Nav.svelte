<script lang="ts">
  import { ModeToggle } from "$lib";
  import { Popcorn } from "lucide-svelte";
  import { Button } from "$cui/button";
  export let user: { username: string; id: number } | null;
</script>

<div class="flex flex-row justify-between sm:justify-stretch items-center">
  <ModeToggle class="p-3"/>
  <div class="flex-grow flex justify-center">
    <a class="text-xl text-accent-foreground" href="/">
      <Popcorn/>
    </a>
  </div>
  <div class="flex flex-row items-center p-1 gap-1">
    {#if !user}
      <Button href="/sign-in" variant="ghost"
        ><p class="hover:text-primary">sign in</p></Button
      >
      <Button href="/sign-up" variant="ghost"
        ><p class="hover:text-primary">sign up</p></Button
      >
    {:else}
      <p class="hover:text-primary select-none">{user.username}</p>
      <form method="POST" action="/?log_out">
        <Button variant="ghost" type="submit"
          ><p class="hover:text-primary">Log Out</p></Button
        >
      </form>
    {/if}
  </div>
</div>
