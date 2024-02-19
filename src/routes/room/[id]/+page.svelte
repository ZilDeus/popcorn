<script lang="ts">
  import Peer from "peer-lite";
  import { onDestroy, onMount } from "svelte";
  import { Mic, MicOff, Volume2, VolumeX, Search } from "lucide-svelte";
  import { Input } from "$cui/input";
  import { Button } from "$cui/button";
  import { goto } from "$app/navigation";
  import { getRoom } from "./utils";
  import { PUBLIC_WEBSOCKET_URL } from "$env/static/public";
  let websocket: WebSocket;
  let peers: Map<string, Peer> = new Map();
  let audioElements: HTMLAudioElement[] = [];
  let remote = new MediaStream();
  let muted = false,
    sound = true;
  function toggleOtherMute() {
    sound = !sound;
    remote.getAudioTracks().forEach((t) => {
      t.enabled = sound;
    });
  }
  function toggleSelfMute() {
    muted = !muted;
    peers.forEach((p, _) => {
      p.getStreamLocal()
        .getAudioTracks()
        .forEach((t) => {
          t.enabled = !muted;
        });
    });
  }
  async function initConnection() {
    audioElements.forEach((audioEle, _) => {
      audioEle.remove();
    });
    while (audioElements.length) audioElements.pop();
    peers.forEach((peer, _) => {
      peer.removeTracks(peer.getStreamLocal().getTracks());
      peer.destroy();
    });
    peers.clear();
    if (room.users.length <= 0) {
      console.log("not enough users to start a voice chat");
      return;
    }
    room.users.forEach((_) => {
      let audioEle: HTMLAudioElement = new Audio();
      audioElements = [...audioElements, audioEle];
    });
    const myIndex = room.users.indexOf(data.user.username);
    if (myIndex == -1) {
      console.log("god kill me");
    }
    const from = room.users[myIndex];
    const localAudio = await Peer.getUserMedia({ audio: true, video: false });
    for (let i = myIndex + 1; i < room.users.length; i++) {
      const to = room.users[i];
      const peer = new Peer();
      peer.addStream(localAudio);
      peer.start();
      peer.on("streamRemote", (stream) => {
        console.log("got a stream from ", to);
        const audioEle = audioElements[i];
        if (audioEle) {
          audioEle.srcObject = stream;
          audioEle.play();
        }
      });
      peer.on("onicecandidates", (iceCandidates) => {
        console.log(`sending candidates from ${from} to ${to}`);
        websocket.send(
          JSON.stringify({
            event: "candidates",
            from: from,
            data: {
              candidates: iceCandidates,
              from: from,
              to: to,
            },
          }),
        );
      });
      peer.on("signal", (desc) => {
        console.log(`sending offer from ${from} to ${to}`);
        websocket.send(
          JSON.stringify({
            event: "offer",
            sender: to,
            data: {
              from: from,
              to: to,
              description: desc,
            },
          }),
        );
      });
      peers.set(to, peer);
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
  export let data;
  onDestroy(async () => {
    websocket?.close();
  });
  onMount(async () => {
    try {
      websocket = new WebSocket(`${PUBLIC_WEBSOCKET_URL}/ws`);
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
            {
              console.log(
                `recived candidates from ${eventData.data.from} to me ${eventData.data.to}`,
              );
              const peer = peers.get(eventData.data.from);
              eventData.data.candidates.forEach(async (c: RTCIceCandidate) => {
                peer?.addIceCandidate(c);
              });
            }
            break;
          case "answer":
            {
              const desc = eventData.data.description;
              console.log(
                `recived answer from ${eventData.data.from} to me ${eventData.data.to}`,
                desc,
              );
              const peer = peers.get(eventData.data.from);
              peer?.signal(desc);
              console.log(
                `client ${eventData.data.from} and ${eventData.data.to} are connected !`,
              );
            }
            break;
          case "offer":
            const func = async () => {
              console.log(
                `recived offer from ${eventData.data.from} to me ${eventData.data.to}`,
              );
              const peer = new Peer();
              const localAudio = await Peer.getUserMedia({
                audio: true,
                video: false,
              });
              peer.addStream(localAudio);
              peer.signal(eventData.data.description);
              peer.on("streamRemote", (stream) => {
                console.log("got a stream from ", eventData.data.from);
                const audioEle: HTMLAudioElement = new Audio();
                audioEle.srcObject = stream;
                audioEle.play();
                audioElements = [...audioElements, audioEle];
              });
              peer.on("onicecandidates", (iceCandidates) => {
                console.log(
                  `sending iceCandidates from ${eventData.data.to} to  ${eventData.data.from}`,
                );
                websocket.send(
                  JSON.stringify({
                    event: "candidates",
                    sender: eventData.data.to,
                    data: {
                      from: eventData.data.to,
                      to: eventData.data.from,
                      candidates: iceCandidates,
                    },
                  }),
                );
              });
              peer.on("signal", (desc) => {
                console.log(
                  `sending answer from ${eventData.data.to} to  ${eventData.data.from}`,
                );
                websocket.send(
                  JSON.stringify({
                    event: "answer",
                    sender: eventData.data.to,
                    data: {
                      from: eventData.data.to,
                      to: eventData.data.from,
                      description: desc,
                    },
                  }),
                );
              });
              peers.set(eventData.data.from, peer);
            };
            func();
            break;
          case "room-update":
            if (room.users.length < eventData.data.users.length) {
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
            }
            room = eventData.data;
            initConnection();
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

{#each audioElements as audioEle}
  <audio bind:this={audioEle} class="hidden" autoplay />
{/each}
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
