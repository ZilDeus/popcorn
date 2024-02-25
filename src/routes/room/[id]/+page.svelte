<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Mic, MicOff, Volume2, VolumeX, Search } from "lucide-svelte";
  import { Input } from "$cui/input";
  import { Button } from "$cui/button";
  import { goto } from "$app/navigation";
  import { getRoom } from "./utils";
  import { PUBLIC_WEBSOCKET_URL } from "$env/static/public";
  import { VoiceChat } from "./voiceChat";
  export let data;
  let websocket: WebSocket;
  let mute = false,
    sound = true;
  const vc = new VoiceChat(data.user.username);
  async function AddConnection(users: string[]) {
    //start counting from my index and up
    const myIndex = users.indexOf(data.user.username);
    if (myIndex == -1) {
      console.log("god kill me");
      return;
    }
    //find if the peer is already in the vc if not create another peer
    for (let i = myIndex + 1; i < users.length; i++) {
      vc.AddPeer(users[i]);
    }
  }
  let messageToSend: string;
  let messages: { data: string; sender: string; type: number }[];
  messages = [];
  let room: { name: string; id: string; users: string[] } = {
    name: "",
    id: "",
    users: [],
  };
  let videoEle: HTMLVideoElement;
  let videoSrc = "";
  function changeVideoSource() {
    videoEle.src = videoSrc;
    videoEle.focus();
    websocket.send(
      JSON.stringify({
        event: "load",
        from: data.user.username,
        data: {
          url: videoSrc,
          time: 0,
        },
      }),
    );
  }
  function changeVideoSourceEvent(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      changeVideoSource();
    }
  }
  onDestroy(async () => {
    vc.Close();
    websocket?.close();
  });
  onMount(async () => {
    //vc.onToggleMute = (mute) => {
    //  console.log("mute status was changed from", !mute, "to", mute);
    //};
    vc.addEventListener("sound-toggle", () => {
      sound = !sound;
    });
    vc.addEventListener("mute-toggle", () => {
      mute = !mute;
    });

    vc.addEventListener("peer-join", (ev: Event) => {
      const e = ev as CustomEvent;
      console.log("peer", e.detail.peer, "joined");
    });
    vc.addEventListener("peer-join", (ev: Event) => {
      const e = ev as CustomEvent;
      console.log("peer", e.detail.peer, "left");
    });
    //vc.onPeer = (_) => {
    //  console.log("i sense a disturbance in the force!!");
    //};
    //vc.onPeerJoined = (name) => {
    //  console.log("new peer", name, " joined the voice chat");
    //};
    //vc.onPeerLeft = (name) => {
    //  console.log("peer", name, " left the");
    //};
    //vc.onAddStream = (name, stream) => {
    //  const audio = new Audio();
    //  audio.srcObject = stream;
    //  audio.play();
    //  //remoteStreams.set(name, audio);
    //  audioElements = [...audioElements, { peer: name, audioElement: audio }];
    //};
    //vc.onRemoveStream = (name) => {
    //  const index = audioElements.findIndex((t) => t.peer == name);
    //  audioElements[index].audioElement.pause();
    //  audioElements = audioElements.splice(index, 1);
    //  //trigger the update
    //};
    try {
      websocket = new WebSocket(`${PUBLIC_WEBSOCKET_URL}/ws`);
      vc.Init(websocket);
      // Connection opened
      websocket.addEventListener("open", (_) => {
        if (data.user) {
          console.log(data);
          websocket.send(
            JSON.stringify({
              username: data.user.username,
              room: data.roomId,
            }),
          );
        }
      });
      websocket.addEventListener("close", async (_) => {
        websocket.close();
      });
      websocket.addEventListener("message", (event) => {
        const eventData = JSON.parse(event.data);
        switch (eventData.event) {
          case "candidates":
            vc.AddCandidateToPeer(
              eventData.data.from,
              eventData.data.candidate,
            );
            break;
          case "answer":
            {
              vc.AnswerPeer(eventData.data.from, eventData.data.description);
            }
            break;
          case "offer":
            vc.AddPeer(eventData.sender, eventData.data.description);
            break;
          case "room-update":
            if (room.users.length < eventData.data.users.length) {
              AddConnection(eventData.data.users);
              messages = [
                ...messages,
                {
                  data: "just joined the room",
                  type: 1,
                  sender: eventData.sender,
                },
              ];
              if (videoEle.src != "") {
                console.log("updating new commers videos");
                websocket.send(
                  JSON.stringify({
                    event: "load",
                    from: data.user.username,
                    data: {
                      url: videoEle.src,
                      time: videoEle.currentTime,
                    },
                  }),
                );
              }
            } else {
              messages = [
                ...messages,
                {
                  data: "just left the room",
                  type: 1,
                  sender: eventData.sender,
                },
              ];
              vc.RemovePeer(eventData.sender);
            }
            room = eventData.data;
            break;
          case "message":
            messages = [
              ...messages,
              { data: eventData.data.body, type: 0, sender: eventData.sender },
            ];
            break;
          case "play":
            {
              const timeInM = Math.floor(eventData.data.time / 60);
              const timeInS = Math.floor(eventData.data.time % 60);
              messages = [
                ...messages,
                {
                  data: `played the video on ${timeInM}:${timeInS}`,
                  type: 1,
                  sender: eventData.sender,
                },
              ];
              videoEle.play();
            }
            break;
          case "pause":
            {
              if (videoEle.currentTime == eventData.data.time) return;
              videoEle.currentTime = eventData.data.time;
              videoEle.pause();
            }
            break;
          case "load":
            {
              if (videoEle.src == eventData.data.url) return;
              videoEle.src = eventData.data.url;
              videoEle.currentTime = eventData.data.time ?? 0;
            }
            break;
        }
      });
    } catch (e) {
      console.log(e);
    }
    const roomExsist = await getRoom(data.roomId);
    if (!roomExsist) goto("/");
  });
</script>

<div class="flex flex-row justify-around">
  <p class="text-center text-primary">{room.name}</p>
  <p class="text-center text-primary">{room.users.length}</p>
</div>
<div
  class="flex-grow p-2 flex flex-col gap-1 items-stretch justify-start lg:flex-row"
>
  <div class="flex flex-col gap-1 lg:flex-grow p-1">
    <div class="flex-grow flex justify-center max-h-64 lg:max-h-full">
      <video
        controls
        bind:this={videoEle}
        on:seeked={(_) => {
          console.log("seeked");
          const time = videoEle.currentTime;
          websocket.send(
            JSON.stringify({
              event: "pause",
              sender: data.user.username,
              data: {
                time: time,
              },
            }),
          );
        }}
        on:pause={(_) => {
          console.log("pause");
          const time = videoEle.currentTime;
          websocket.send(
            JSON.stringify({
              event: "pause",
              sender: data.user.username,
              data: {
                time: time,
              },
            }),
          );
        }}
        on:play={(_) => {
          console.log("play");
          websocket.send(
            JSON.stringify({
              event: "play",
              sender: data.user.username,
              data: {
                time: videoEle.currentTime,
              },
            }),
          );
        }}
      >
        <track kind="captions" />
      </video>
    </div>
    <div class="hidden"></div>
    <div class="flex flex-row gap-1">
      <Input
        placeholder="enter video URL"
        bind:value={videoSrc}
        on:keypress={changeVideoSourceEvent}
      />
      <Button on:click={changeVideoSource}><Search /></Button>
    </div>
  </div>
  <div class="flex-grow flex flex-col gap-2 w-full lg:max-w-2xl">
    <div class="flex-grow flex flex-col">
      <div
        class="h-80 overflow-x-clip overflow-y-scroll flex-grow border border-primary flex flex-col rounded-lg gap-2 p-1"
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
            websocket.send(
              JSON.stringify({
                event: "message",
                data: {
                  sender: data.user?.username,
                  room: data.roomId,
                  body: messageToSend,
                },
              }),
            );
            messageToSend = "";
          }
        }}
      />
      <Button on:click={() => vc.ToggleMute()}>
        {#if mute}
          <MicOff />
        {:else}
          <Mic />
        {/if}
      </Button>
      <Button on:click={() => vc.ToggleSound()}>
        {#if sound}
          <Volume2 />
        {:else}
          <VolumeX />
        {/if}
      </Button>
    </div>
  </div>
</div>
