
let RTCConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'turn:turn01.hubl.in?transport=udp',
        'turn:turn02.hubl.in?transport=tcp',
        'turn:numb.viagenie.ca',
      ],
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ],
}
export class VoiceChat extends EventTarget {
  muted: boolean = false;
  self: string = "";
  signalingServer?: WebSocket;
  sound: boolean = true;
  peers: Map<string, RTCPeerConnection> = new Map();
  candidates: Map<string, RTCIceCandidate[]> = new Map();
  remoteStreams: Map<string, MediaStream> = new Map();
  localStream?: MediaStream;
  streamAudios: Map<MediaStream, HTMLAudioElement> = new Map();
  constructor(self: string) {
    super()
    this.self = self;
  }
  public Init(server: WebSocket) {
    this.signalingServer = server;
  }
  public HasPeer(name: string) {
    return this.peers.has(name);
  }
  public GetPeer(name: string): RTCPeerConnection | undefined {
    return this.peers.get(name);
  }
  private async AddAnswerPeer(peer: RTCPeerConnection, peerName: string, description: RTCSessionDescriptionInit) {
    console.log(
      `recived offer from ${peerName} to me ${this.self}`,
    );
    peer.setRemoteDescription(description);
    peer.createAnswer().then((answer) => {
      peer.setLocalDescription(answer);
      console.log("sending answer from me", this.self, "to", peerName)
      console.log("peer", this.self, "can now recive IceCandidates from peer", peerName);
      this.signalingServer?.send(
        JSON.stringify({
          event: 'answer',
          sender: this.self,
          data: {
            from: this.self,
            to: peerName,
            description: answer,
          }
        })
      )
    })
    peer.ontrack = (ev) => {
      console.log("got a track form peer", peerName)
      this.AddStream(peerName, ev.track)
    }
    peer.onicecandidate = (ev) => {
      console.log("sending candidates from me", this.self, "to", peerName)
      this.signalingServer?.send(
        JSON.stringify({
          event: 'candidates',
          sender: this.self,
          data: {
            from: this.self,
            to: peerName,
            candidate: ev.candidate,
          }
        })
      )
    }
    this.peers.set(peerName, peer);
  }
  public AnswerPeer(peerName: string, description: RTCSessionDescription) {
    console.log("recived answer from", peerName, "to me", this.self);
    const peer = this.peers.get(peerName);
    peer?.setRemoteDescription(description);
    console.log("peer ", this.self, "can now recive IceCandidates from", peerName);
  }
  private async AddOfferPeer(peer: RTCPeerConnection, peerName: string) {
    peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    }).then((offer) => {
      console.log("sending offer from me", this.self, "to", peerName)
      peer.setLocalDescription(offer);
      this.signalingServer?.send(
        JSON.stringify({
          event: 'offer',
          sender: this.self,
          data: {
            from: this.self,
            to: peerName,
            description: offer,
          }
        })
      )
    });

    peer.ontrack = (ev) => {
      console.log("got a track form peer", peerName)
      this.AddStream(peerName, ev.track)
    }

    peer.onicecandidate = (ev) => {
      //console.log("sending candidates from me", this.self, "to", peerName)
      this.signalingServer?.send(
        JSON.stringify({
          event: 'candidates',
          sender: this.self,
          data: {
            from: this.self,
            to: peerName,
            candidate: ev.candidate,
          }
        })
      )
    }
    this.peers.set(peerName, peer);
  }
  public AddCandidateToPeer(peerName: string, candidate: RTCIceCandidate) {
    console.log('recived candidates from', peerName, 'to me', this.self);
    const peer = this.peers.get(peerName);
    if (!peer)
      return;
    if (peer.localDescription && peer.remoteDescription) {
      console.log("peer", this.self, "is ready to recive ICE from peer", peerName)
      peer.addIceCandidate(candidate);
      while (this.candidates.get(peerName)?.length) {
        peer.addIceCandidate(this.candidates.get(peerName)?.pop());
      }
    }
    else
      this.candidates.get(peerName)?.push(candidate);

  }
  public AddPeer(peerName: string): void;
  public AddPeer(peerName: string, desc: RTCSessionDescriptionInit): void;
  public async AddPeer(peerName: string, desc?: RTCSessionDescriptionInit): Promise<void> {
    if (this.HasPeer(peerName)) {
      console.log("peer already connected");
      return;
    }
    console.log("adding a peer", peerName, " to vc");
    if (!this.localStream)
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection(RTCConfig);
    this.localStream.getAudioTracks().forEach((t) => peer.addTrack(t))
    if (desc)
      this.AddAnswerPeer(peer, peerName, desc);
    else
      this.AddOfferPeer(peer, peerName);
    super.dispatchEvent(
      new CustomEvent('peer-join', { detail: { peer: peerName } })
    )
  }

  public AddStream(name: string, track: MediaStreamTrack) {
    const stream = new MediaStream();
    stream.addTrack(track);
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
    this.remoteStreams.set(name, stream);
    this.streamAudios.set(stream, audio);
  }
  public RemovePeer(name: string) {
    this.peers.delete(name);
    let stream = this.remoteStreams.get(name);
    if (stream)
      this.streamAudios.get(stream)?.pause();
    stream?.getTracks().forEach((t) => t.stop());
    this.remoteStreams.delete(name)
    super.dispatchEvent(
      new CustomEvent('peer-left', { detail: { peer: name } })
    )
  }
  public GetRemoteStreams() {
    return this.remoteStreams;
  }
  public ToggleMute() {
    this.muted = !this.muted;
    this.localStream?.getAudioTracks().forEach((t) => t.enabled = !this.muted)
    super.dispatchEvent(
      new CustomEvent('mute-toggle')
    )
  }
  public ToggleSound() {
    this.sound = !this.sound;
    this.remoteStreams.forEach((stream) => stream.getAudioTracks().forEach((t) => t.enabled = this.sound))
    super.dispatchEvent(
      new CustomEvent('sound-toggle')
    )
  }
  public IsMuted() {
    return this.muted;
  }
  public IsSound() {
    return this.sound;
  }
  public Close() {
    this.streamAudios.forEach((audio) => audio.pause())
    this.remoteStreams.forEach((stream) => stream.getAudioTracks().forEach((t) => t.stop()))
  }
}
