<script lang="ts">
  import { Mic, MicOff, Volume2, VolumeX, Search } from "lucide-svelte";
  import { Input } from "$cui/input";
  import { Button } from "$cui/button";
  let messages: { data: string; sender: string; type: number }[] = [];
  let messageToSend: string;
  let muted = false,
    sound = true;
  function toggleOtherMute() {
    sound = !sound;
  }
  function toggleSelfMute() {
    muted = !muted;
  }
</script>

<div class="flex flex-row justify-around">
  <p class="text-center text-primary">test</p>
  <p class="text-center text-primary">12</p>
</div>
<div
  class="flex-grow p-2 flex flex-col gap-1 items-stretch justify-start lg:flex-row"
>
  <div class="flex flex-col gap-1 lg:flex-grow p-1">
    <div class="flex-grow flex justify-center max-h-64 lg:max-h-full">
      <video controls>
        <track kind="captions" />
      </video>
    </div>
    <div class="flex flex-row gap-1">
      <Input placeholder="enter video URL" />
      <Button><Search /></Button>
    </div>
  </div>
  <div class="flex-grow flex flex-col gap-2 w-full lg:max-w-2xl">
    <div class="flex-grow flex flex-col">
      <div
        class="h-80 flex-grow overflow-scroll border border-primary flex flex-col rounded-lg gap-2 p-1"
      >
        {#each messages as msg}
          {#if msg.type}
            <p class="text-primary text-center text-xs">
              {msg.sender}: {msg.data}
            </p>
          {:else}
            <div class="rounded-lg bg-accent w-fit pr-3 pb-1">
              <p>{msg.sender}: {msg.data}</p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="flex flex-row gap-2">
      <Input
        placeholder="enter your message"
        bind:value={messageToSend}
        on:keypress={(ev) => {
          if (ev.key == "Enter") {
            messages = [
              ...messages,
              { sender: "ZilDeus", data: messageToSend, type: 0 },
            ];
            messageToSend = "";
          }
        }}
      />
      <Button on:click={toggleSelfMute}>
        {#if muted}
          <MicOff />
        {:else}
          <Mic />
        {/if}
      </Button>
      <Button on:click={toggleOtherMute}>
        {#if sound}
          <Volume2 />
        {:else}
          <VolumeX />
        {/if}
      </Button>
    </div>
  </div>
</div>
