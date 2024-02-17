<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { PUBLIC_SERVER_URL } from "$env/static/public";
  import { Button } from "$cui/button";
  import { Input } from "$cui/input";
  import * as AlertDialog from "$cui/alert-dialog";
  import { goto } from "$app/navigation";
  let rooms: { name: string; users: string[]; id: string }[] = [];
  let roomName: string;

  export let data;
  onDestroy(() => {
    sse?.close();
  });
  let sse: EventSource;
  onMount(async () => {
    try {
      sse = new EventSource(`http://${PUBLIC_SERVER_URL}/rooms_sse`);
      sse.onerror = (_) => {
        sse.close();
      };
      sse.addEventListener("create", (ev) => {
        const data = JSON.parse(ev.data);
        rooms = [...rooms, data.data];
        console.log(data.data);
      });
      sse.addEventListener("delete", (ev) => {
        const data = JSON.parse(ev.data);
        rooms = rooms.filter((room) => room.id != data.data);
      });
    } catch (e) {
      console.log(e);
    }
    try {
      const request = await fetch(`http://${PUBLIC_SERVER_URL}/active_rooms`, {
        method: "GET",
      });
      const requestJson = await request.json();
      console.log(requestJson);
      rooms = requestJson.rooms;
    } catch (e) {
      console.log(e);
    }
  });
</script>

<div class="flex items-center justify-center my-5">
  <AlertDialog.Root>
    <AlertDialog.Trigger asChild let:builder>
      <Button builders={[builder]} variant="default">Create New Room !</Button>
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>What Would You Like To Name it?</AlertDialog.Title>
      </AlertDialog.Header>
      <Input bind:value={roomName} />
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action
          on:click={async () => {
            if (data.user && roomName) {
              console.log("sending request to create a room");
              const params = {
                name: roomName,
                username: data.user.username,
              };
              const options = {
                method: "POST",
                body: JSON.stringify(params),
              };
              await fetch(
                `http://${PUBLIC_SERVER_URL}/create_room`,
                options,
              ).then(async (res) => {
                const s = await res.json();
                console.log(s);
                goto(`room/${s.id}`);
              });
            }
          }}>Create!</AlertDialog.Action
        >
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</div>
<div
  class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 min-h-full justify-items-center gap-4 mb-7"
>
  {#each rooms as room}
    <a class="w-32 flex flex-col" href={`/room/${room.id}`}>
      <div
        class="flex justify-center items-center rounded-lg aspect-square bg-secondary flex-grow"
      >
        users:{Math.max(1, room.users.length)}
      </div>
      <p class="text-muted-foreground text-center">{room.name}</p>
    </a>
  {/each}
</div>
