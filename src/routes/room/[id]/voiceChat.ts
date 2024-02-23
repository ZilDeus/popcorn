let RTCConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    }
  ],
}
export class VoiceChat {
  muted: boolean = false;
  self: string = "";
  signalingServer?: WebSocket;
  playing: boolean = true;
  peers: Map<string, RTCPeerConnection> = new Map();
  streams: Map<string, MediaStream> = new Map();
  stream?: MediaStream;
  localStream: MediaStream | null = null;
  onPeerLeft?: (name: string) => void;
  onPeerJoined?: (name: string) => void;
  onPeer?: (name: string) => void;
  onAddStream?: (name: string, stream: MediaStream) => void;
  onRemoveStream?: (name: string) => void;
  constructor(self: string) {
    this.self = self;
  }
  public Init(localStream: MediaStream, server: WebSocket) {
    this.signalingServer = server;
    this.localStream = localStream;
  }
  public HasPeer(name: string) {
    return this.peers.has(name);
  }
  public GetPeer(name: string): RTCPeerConnection | undefined {
    return this.peers.get(name);
  }
  private FireRemoveStream(name: string) {
    if (this.onRemoveStream)
      this.onRemoveStream(name);
  }
  private FireAddStream(name: string, stream: MediaStream) {
    if (this.onAddStream)
      this.onAddStream(name, stream);
  }
  private FireLeft(name: string) {
    if (this.onPeerLeft)
      this.onPeerLeft(name);
  }
  private FireUpdate(name: string) {
    if (this.onPeer)
      this.onPeer(name);
  }
  private FireJoined(name: string) {
    if (this.onPeerJoined)
      this.onPeerJoined(name);
  }
  private async AddAnswerPeer(peerName: string, description: RTCSessionDescriptionInit) {
    console.log(
      `recived offer from ${peerName} to me ${this.self}`,
    );
    const peer = new RTCPeerConnection(RTCConfig);
    this.localStream?.getTracks().forEach((t) => peer.addTrack(t));
    peer.setRemoteDescription(description);
    peer.createAnswer().then((answer) => {
      peer.setLocalDescription(answer);
      console.log("sending answer from me", this.self, "to", peerName)
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
      if (!this.stream)
        this.stream = new MediaStream();
      this.stream.addTrack(ev.track);
      this.FireAddStream(peerName, this.stream);
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
      //create a peer connection , add p1s offer as it's answer
    }
    this.peers.set(peerName, peer);
  }
  private async AddOfferPeer(peerName: string) {
    const peer = new RTCPeerConnection(RTCConfig);
    this.localStream?.getTracks().forEach((t) => peer.addTrack(t));
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
      if (!this.stream)
        this.stream = new MediaStream();
      this.stream.addTrack(ev.track);
      this.FireAddStream(peerName, this.stream);
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
  public AddPeer(peerName: string): void;
  public AddPeer(peerName: string, desc: RTCSessionDescriptionInit): void;
  public AddPeer(peerName: string, desc?: RTCSessionDescriptionInit): void {
    if (this.HasPeer(peerName)) {
      console.log("peer already connected");
      return;
    }
    console.log("adding a peer", peerName, " to vc");
    if (desc)
      this.AddAnswerPeer(peerName, desc);
    else
      this.AddOfferPeer(peerName);
    //this.FireUpdate(peerName);
    //this.FireJoined(peerName);
  }

  public AddStream(name: string, stream: MediaStream) {
    this.streams.set(name, stream);
    this.FireAddStream(name, stream);
  }
  public RemovePeer(name: string) {
    this.peers.delete(name);
    let stream = this.streams.get(name);
    stream?.getTracks().forEach((t) => t.stop());
    this.streams.delete(name)
    this.FireUpdate(name);
    this.FireLeft(name);
    this.FireRemoveStream(name);
  }
  public GetLocalStream() {
    return this.localStream;
  }
  public GetRemoteStreams() {
    return this.streams;
  }
  public ToggleMute() {
    this.muted = !this.muted;
    this.localStream?.getTracks().forEach((track) => track.enabled = this.muted);
  }
  public ToggleSound() {
    this.playing = !this.playing;
    this.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.enabled = this.playing);
    })
  }
  public IsMuted() {
    return this.muted;
  }
  public IsPlaying() {
    return this.playing;
  }
}
