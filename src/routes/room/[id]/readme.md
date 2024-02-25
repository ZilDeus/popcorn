with each passing day my hatered for js grows bigger and bigger
```js
on:click={func}
```
func:
```js
function func(){
  console.log("wow i can't believe you just ran me!!")
  dispatchEvent(...)
  console.log("alright im done running...QUITING")
}
```
listener:
```js
addEventListener("...",()=>{console.log("event fired, take cover")})
```
output:
```
  wow i can't believe you just ran me!!
  alright im done running...QUITING
```
did you catch it?? the event never fired!
thanks js
btw this is how you fix it
```js
on:click={()=>func()}
```
